# 市政 debug松 brief — Track #1 把三千棵樹種回來
Fetched 2026-10-13 from https://puma.taipei/hackathon (server-rendered; no JS needed). Sub-pages: /hackathon/register, /hackathon/vote, /hackathon/my-team (all sections are anchors on the main page: #issues #schedule #rules).
Host: 沈伯洋競選辦公室. Coordinator: 資訊顧問 黑貘 (= 洪進吉, "食夢黑貘").

## Logistics
- Register by **10/18 (Sun) 23:59**, 80 seats, free. Teams of 1+; every member takes a seat; no duplicate signups. Selected teams get an email; rejected get nothing.
- **Day 1: Fri 10/23 19:00-22:00, Discord.** 19:00-19:20 opening/rules/data tour; 19:20-22:00 individuals or teams propose the pain point and approach, swap ideas. No teammate matching (self-organize).
- **Day 2: Sat 10/24 09:30-18:00, 沈伯洋競選總部** (中正區北平東路30-1號1樓; address confirmed after signup). Lunch + snacks. At least one member on-site; others may work remotely.
- 10:30-16:30 build. **12:00 Demo list + order announced. 16:00 submission deadline.**
- 16:30-17:00 Demo (YouTube Live, 沈伯洋 present). 17:00-17:55 panel 「AI 寫得出程式，寫不出城市」(黑貘 hosts; 沈伯洋, 蕭上農, 杜奕瑾, 侯宜秀). 17:55 wrap-up: 沈伯洋 announces 工程師後援會.

## Track #1 verbatim
> #1 把三千棵樹種回來 · 環境 · 樹蔭公平 Shade Equity · GIS
> 2025 年台北有 3,164 棵樹被移除。市府說明多為病蟲害或自然死亡，但東門市場附近一棵約 40 年、原本計畫移植保留的茄苳樹，卻遭到「誤砍」。台北一年移除三千棵樹，我們要如何找出城市空間把樹種回來，達到樹蔭公平？可參考新加坡「見縫插樹」。

Datasets listed (all):
- 臺北市行道樹及公園樹木分布圖 (data.gov.tw, CSV/JSON): https://data.gov.tw/dataset/128274
- 臺北市人行道固定設施物＿樹穴 (data.gov.tw): https://data.gov.tw/dataset/134908
- 臺北市人行道範圍圖 (data.taipei, JSON): https://data.taipei/dataset/detail?id=715d3a83-8445-4496-b6bf-b0900538b7e7
- 臺北市公園基本資料 (data.taipei, JSON): https://data.taipei/dataset/detail?id=ea732fb5-4bec-4be7-93f2-8ab91e74a6c6
- 臺北市行道樹路燈資訊網（含移樹履歷查詢）(公園處): https://geopkl.gov.taipei/
- Page's own caveat: 逐年移除紀錄與原因未完整開放 → 可用模擬資料.
- Licence: 政府資料開放授權條款 https://data.gov.tw/license. Other site-wide data portal: https://data.taipei
- Cross-track options allowed ("每隊選一題，也可跨題整合"); #7 is a free topic.

## Rules (verbatim-ish)
- 作品形式不限 (App/網站/儀表板/原型/聊天機器人); target = quickly verifiable MVP. **Demo must be live operation; slides/mockups alone do not count.**
- Simulated data is fine ("作品重點是解法和可操作的介面"). README must state which data is real vs simulated; also say it in the Demo. No real personal data.
- 「市長，你給我聽好了」data: de-identified, "即將釋出", for this event only, no re-identifying complainants. (As of 10/13 not yet released; page says it's coming.)
- Coding may start Day 1. Open-source packages and AI tools allowed; **disclose them in README**.
- Recommended README section: 「如果市府上任 100 天內要落地，需要做什麼」: which bureau, which data, how much cost.
- Submit before 10/24 16:00 via the team's own link: 作品名稱 + 作品網址 (live URL); GitHub/GitLab URL optional.
- Copyright stays with team. With team consent, work is open-sourced (suggest MIT or CC BY 4.0) into "ㄅ級分" for continued iteration; declining does not affect eligibility or vote.
- No unauthorized scanning/stress/pen-testing of city or third-party systems. Livestream is recorded; opt-out sticker at check-in.
- Joining ≠ joining 後援會.

## Demo + judging
- **No judges, no ranking.** Online vote picks top 3. 10 teams demo (maybe 15), ~2 min each, **order drawn on-site**; 12:00 announcement of the Demo list (the page does not say how the 10-15 are picked; presumably organizer selection from submissions, unconfirmed).
- Vote: https://puma.taipei/hackathon/vote, opens 10/24 16:30, closes **10/31 (Sat) 18:00**. Google or LINE login, one vote action per account, **up to 3 picks**; bot/auto votes not counted; ties share rank.
- Top 3 published on the campaign site within 7 days after close (with team consent). **No prize money.**
- After: 工程師後援會 opens free signup after the panel; 黑貘 leads its formation. Page frames output as "未來市政推動的方針" (policy direction input), not a contract.

## Citizen-input source
- 「市長，你給我聽好了」 https://puma.taipei/taipeispeaksup (>1,000 complaints/suggestions; page body did not render in curl, check in browser). Policy team distilled 7 pain points. De-identified dataset promised on the hackathon page, not yet live.

## Background (web)
- **Candidate stance on trees:** July 2026 proposed 路樹健檢 → 樹穴改善 → 移植規劃 → long-term care, "預防勝於治療"; asks whether 樹穴 are too small or poorly sited (LTN: https://news.ltn.com.tw/amp/news/politics/breakingnews/5504656 ; NOWnews https://www.nownews.com/news/6869319). Aug 2026: 台北都市林自治條例, deputy-mayor-chaired 都市森林委員會, ~NT$1B 維運基金, cites "3-30-300", notes Taipei 綠覆率 ~18% (udn https://udn.com/news/story/124652/9626067 ; Newtalk https://newtalk.tw/news/view/2026-08-26/1055724). HEART promise: 四年後「樹蔭回來」. (Search-tool summaries; open the articles to confirm figures before quoting.)
- **3,164:** city's response (July 2026) to a rumor of 4,000+ cut in 2 years: 3,164 removed in 2025 for safety (dead/high-risk), 2,630 (>80%) natural causes; city says 13,225 planted in same period. Councilor 洪婉臻 counts 3,164 (2025) + 1,425 (2024) = 4,589 lost, all from 公園處 replies (Newtalk https://newtalk.tw/news/view/2026-07-13/1046868 ; https://www.nownews.com/news/6855924).
- **東門市場 茄苳:** 金山南路一段; tree meant for transplant (樹穴 too small) was removed whole by outsourced contractor; 公園處 fined/claimed NT$325,210 under 行道樹管理維護自治條例 §7, §12; mayor 蔣萬安 "嚴懲不貸"; transplant jobs now need supervisor on-site check (same sources).
- **黑貘:** 洪進吉, full-stack engineer, 部落格觀察 founder, built the campaign site with a "公民工程師" team; earlier built 服貿東西軍 in 30 hours via data mining (Newtalk https://newtalk.tw/news/view/2026-06-24/1043014). I found no coverage of his past hackathons or winners; this appears to be his first run of this format. g0v precedent for criteria (impact, reusability/open source, feasibility, completeness, locality): https://www.inside.com.tw/article/7980-g0v-3-million-project

## What wins here
1. **Votes from the public, not judges:** a 2-minute demo a layperson gets instantly (a map of "plant here" spots with a visible shade-gap score) beats technical depth. Citizen-readable beats clever.
2. **Live and clickable on 10/24 16:00:** deployed URL, real interaction, no slides-only. Ship the URL before 16:00, rehearse the 2-min flow, and have a fallback if the livestream Wi-Fi dies.
3. **Honest data labeling:** simulated removal records are explicitly allowed, but README + spoken disclosure of real vs fake is mandatory. Use real tree/樹穴/sidewalk/park layers; simulate only the removal history.
4. **Speak to the campaign's own agenda:** tie output to the 樹穴 (too-small pits), 路樹健檢, transplant tracking, and 3-30-300 framing the candidate already uses; equity (which neighborhoods lack canopy) is the hook. Include the "100-day plan: which bureau (公園處/工務局), which data, what cost" README section.
5. **Reusable and adoptable:** MIT/CC BY 4.0 repo, clean README, and a path the 工程師後援會 can iterate on. Judge-free voting plus follow-on adoption means a shareable link (vote ask to friends, 3 picks per account) and a story that fits in one social post matter.
