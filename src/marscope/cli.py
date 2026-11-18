"""Command line: ``marscope --video clip.mp4`` or ``marscope --serve``."""

import argparse
import logging
import sys
from pathlib import Path
from typing import TYPE_CHECKING

from marscope.analysis.ranges import rarity
from marscope.explain.policy import JURISDICTIONS
from marscope.models.registry import parse_models


if TYPE_CHECKING:
    from marscope.schema import VideoResult


def build_parser() -> argparse.ArgumentParser:
    """Build the argument parser.

    Returns
    -------
    argparse.ArgumentParser
        The parser.
    """
    parser = argparse.ArgumentParser(
        prog="marscope",
        description="See what a video deepfake detector sees. A study tool: scores are model outputs, not evidence.",
    )
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--video", type=Path, help="analyze one video file")
    source.add_argument("--serve", action="store_true", help="run the local UI and REST API")
    parser.add_argument("--models", default=None, help="mars (default), gend, dfd-hr, comma-separated, or all")
    parser.add_argument("--sequential", action="store_true", help="run one model at a time to fit a small GPU")
    parser.add_argument("--device", choices=["auto", "cuda", "cpu"], default="auto")
    parser.add_argument(
        "--precision",
        choices=["auto", "fp16", "fp32"],
        default="auto",
        help="model file on the GPU: auto is fp16 (default); the CPU always runs fp32",
    )
    parser.add_argument("--jurisdiction", choices=JURISDICTIONS, help="region for context notes")
    parser.add_argument("--language", choices=["en", "fr"], default="en")
    parser.add_argument("--no-faces", action="store_true", help="skip face detection (A1 and the A3 face checks)")
    output = parser.add_mutually_exclusive_group()
    output.add_argument("--json", action="store_true", help="print the full result as JSON")
    output.add_argument("--report", choices=["markdown", "html", "pdf"], help="write a report next to the video")
    parser.add_argument("--no-llm", action="store_true", help="use the template report even if an LLM is set up")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--verbose", action="store_true")
    return parser


def main(argv: list[str] | None = None) -> int:
    """Run the command line.

    Parameters
    ----------
    argv : list of str, optional
        Arguments (defaults to ``sys.argv``).

    Returns
    -------
    int
        Exit code.
    """
    args = build_parser().parse_args(argv)
    logging.basicConfig(level=logging.INFO if args.verbose else logging.WARNING, format="%(levelname)s %(message)s")
    from marscope.pipeline import MARScope  # noqa: PLC0415 - keep --help fast

    try:
        models = parse_models(args.models)
    except ValueError as error:
        print(f"marscope: {error}", file=sys.stderr)
        return 2
    toolkit = MARScope(
        models=models,
        device=args.device,
        sequential=args.sequential,
        faces=not args.no_faces,
        precision=args.precision,
    )

    if args.serve:
        from marscope.api import serve  # noqa: PLC0415

        preload = models if args.models != "all" else ["mars"]  # with all, the others load when picked
        print(f"MARScope at http://{args.host}:{args.port}  (the video stays on this machine)")
        serve(host=args.host, port=args.port, toolkit=toolkit, preload=preload)
        return 0

    if not args.video.exists():
        print(f"marscope: {args.video} does not exist", file=sys.stderr)
        return 2

    def progress(event: dict[str, object]) -> None:
        if args.json:
            return
        if event.get("type") == "stage" and event.get("stage") == "loading":
            print(f"loading {event['model']}…", file=sys.stderr)
        elif event.get("type") == "clip":
            print(f"\r{event['model']}: clip {event['done']}", end="", file=sys.stderr)

    import av  # noqa: PLC0415

    try:
        result = toolkit.analyze(args.video, jurisdiction=args.jurisdiction, language=args.language, progress=progress)
    except (ValueError, av.FFmpegError) as error:
        print(f"marscope: could not read {args.video.name}: {error}", file=sys.stderr)
        return 2
    if not args.json:
        print(file=sys.stderr)
    if args.json:
        print(result.model_dump_json(indent=2))
    elif args.report:
        _write_report(args, result)
    else:
        print(format_summary(result.model_dump(mode="json")))
    return 0


def _write_report(args: argparse.Namespace, result: "VideoResult") -> None:
    """Write the report next to the video, in the format asked for."""
    from marscope.explain.report import build_report, to_html, to_markdown, to_pdf  # noqa: PLC0415

    report = build_report(result, use_llm=not args.no_llm, language=args.language)
    if not args.no_llm and report.summary_source == "template":
        print(f"marscope: {report.by_line}", file=sys.stderr)
    suffix = {"markdown": ".md", "html": ".html", "pdf": ".pdf"}[args.report]
    out = args.video.with_name(f"{args.video.stem}-report{suffix}")
    if args.report == "pdf":
        out.write_bytes(to_pdf(report))
    else:
        out.write_text(to_markdown(report) if args.report == "markdown" else to_html(report), encoding="utf-8")
    print(f"report written to {out}")


def format_summary(result: dict[str, object]) -> str:
    """Plain-text summary for the terminal.

    Parameters
    ----------
    result : dict
        ``VideoResult.model_dump(mode="json")``.

    Returns
    -------
    str
        Scores in context and the notes.
    """
    video = result["video"]
    assert isinstance(video, dict)
    lines = [
        f"{video['name']}  {video['duration_s']:.1f} s  {video['width']}x{video['height']}  {video['n_clips']} clips",
        "",
    ]
    models = result["models"]
    assert isinstance(models, dict)
    for score in models.values():
        ctx = score["context"]
        label, odds = rarity(ctx["real_rank"], score["name"])
        low, high = (round(v * 100) for v in ctx["real_range"])
        lines.append(
            f"{score['name']:<7} probability of fake {round(score['fake'] * 100)}%  "
            f"[{score['device']} {score['precision']}]",
        )
        lines.append(f"        {label}: {odds} (real videos usually {low}–{high}%)")
        if score.get("device_note"):
            lines.append(f"        note: {score['device_note']}")
    lines.append("")
    notes = result["notes"]
    assert isinstance(notes, list)
    for note in notes:
        prefix = {"at_risk": "!", "breaks": "!", "partly": "~", "holds": "-", "info": " "}[note["state"]]
        lines.append(f"{prefix} {note['text']}")
    lines += ["", "No verdict: a score is a model output, not proof. Use --json for every value and detail."]
    return "\n".join(lines)


if __name__ == "__main__":
    sys.exit(main())
