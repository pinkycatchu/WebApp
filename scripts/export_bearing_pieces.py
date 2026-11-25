"""試験片一覧.xlsx の「支圧」シートから、木口撮影ページ（crack.html の木口モード）が読む data/bearing_pieces.json を作る。

試験片は Specimens シートにないので、ページはこの JSON で「パネル → S/W → 番号」のボタンを作る。
ブラウザから Google ドライブの xlsx は読めないため、リポジトリに JSON として置く。
書き出すのは作成時に決まっている列（試験片ID・暴露試験体ID・条件・加力方向・切り出し位置・DIC・メモ）だけ。
寸法や試験日は試験のたびに増えるので入れない（入れると JSON がすぐ古くなる。換算は研究課の解析側で xlsx から読む）。

使い方（WebApp のフォルダで）
    ..\\..\\.venv\\Scripts\\python scripts\\export_bearing_pieces.py
試験片一覧の割付が変わったら（パネルの追加など）実行し直して commit・push する。
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd

SOURCE = Path(r"L:\My Drive\Labo\Master_Thesis\data\Strength_Test\試験片一覧.xlsx")
OUTPUT = Path(__file__).resolve().parents[1] / "data" / "bearing_pieces.json"
COLUMNS = {"試験片ID": "id", "暴露試験体ID": "panel", "条件": "condition", "加力方向": "direction",
           "切り出し位置": "position", "DIC": "dic", "メモ": "note"}


def main() -> None:
    lock_file = SOURCE.with_name("~$" + SOURCE.name)
    if lock_file.exists():
        # Excel で開いている最中は保存前の内容しか読めないので、閉じてから実行してもらう
        sys.exit(f"{SOURCE.name} が Excel で開かれています（{lock_file.name}）。閉じてから実行してください。")

    table = pd.read_excel(SOURCE, sheet_name="支圧", dtype=str)[list(COLUMNS)].rename(columns=COLUMNS).fillna("")
    table = table[table["id"] != ""]
    table["dic"] = table["dic"] == "○"

    def number_of(piece_id: str) -> int:
        return int(piece_id.rsplit("-", 1)[1][1:])

    pieces = [
        {**row, "number": number_of(row["id"])}
        for row in table.to_dict(orient="records")
    ]
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps({"source": SOURCE.name, "pieces": pieces}, ensure_ascii=False, indent=1),
                      encoding="utf-8")
    panels = table["panel"].nunique()
    print(f"{len(pieces)} 片（{panels} パネル） → {OUTPUT}")


if __name__ == "__main__":
    main()
