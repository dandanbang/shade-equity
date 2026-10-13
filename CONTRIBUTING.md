# 如何參與

謝謝你一起把樹蔭帶到最需要的地方。

- **不用寫程式也能幫忙**：打開地圖，點你的里，用街景確認種樹點，按「空的／已經有樹／不能種」。每一筆都讓施工清單更準。
- **回報問題**：開一個 issue，附上里名、種樹點連結和你看到的情況（有「資料錯誤」範本）。
- **改程式**：fork 之後執行 `make all`，改動盡量小；介面改動請附修改前後的截圖。每個資料產生程式都會印出合理性檢查（最熱／最涼的里、所得最高／最低的里），請保持通過。
- **新增城市**：新增 `data/fetch_<城市>.sh`，以及輸出相同 `data/derived/` 檔案的產生程式（樹冠、年齡、所得、溫度、步行目的地、種樹點）。請先開 issue 討論格式。
- **原則**：只用真實資料；估計值要標明；網站上的每個數字都要能追溯到 `data/` 裡的檔案和程式。

*English: issues and PRs welcome in English too. Verify sites on the map, report data errors via the issue template, keep `make all` sanity checks passing, open an issue before adding a new city.*
