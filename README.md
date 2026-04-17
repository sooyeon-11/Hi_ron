# 하이론 Hi_ron — Fan Info Page

댄서 · 크리에이터 **하이론(@_hi_ron)** 을 소개하는 팬 페이지입니다.
인스타그램 · 유튜브 · 틱톡의 최신 콘텐츠를 한 페이지에서 확인할 수 있고,
나무위키 내용을 기반으로 한 상세 프로필 섹션을 포함합니다.

## 구성

- `index.html` — 메인 페이지 (프로필 / 각 SNS 섹션 / 상세 소개 / 푸터)
- `css/style.css` — 보라 테마 스타일시트
- `js/main.js` — RSS 기반 피드 자동 로더

## 실시간 피드 연동

| 플랫폼 | 방식 |
|---|---|
| YouTube | 공식 RSS (Atom) |
| Instagram | [rss.app](https://rss.app) 생성 피드 |
| TikTok | [rss.app](https://rss.app) 생성 피드 |

## 로컬 실행

CORS 이슈를 피하려면 HTTP 서버로 여는 걸 권장합니다.

```bash
# Python 3
python -m http.server 8000
# 또는 VS Code "Live Server" 확장 사용
```

이후 `http://localhost:8000` 접속.

## 크레딧

- 페이지 제작: **© youn.so** ([@xuvea2](https://www.instagram.com/xuvea2/))
- 원문 참조: [나무위키 – 하이론](https://namu.wiki/w/%ED%95%98%EC%9D%B4%EB%A1%A0)
