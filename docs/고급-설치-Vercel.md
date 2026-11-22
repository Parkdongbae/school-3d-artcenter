# 고급 설치 — 학교 전용 사이트를 Vercel에 직접 만들기

> 대부분의 학교는 이 문서가 **필요 없습니다.** [README의 쉬운 방법](../README.md)으로 충분합니다.
> 아래에 해당할 때만 쓰세요.
>
> - 학생이 아주 많아(수백 명) 사진을 작게 줄여 사이트에 저장해 두고 싶다
> - 주소 뒤에 긴 글자가 붙지 않는 학교 전용 주소(`우리학교.vercel.app`)를 쓰고 싶다
> - 비속어 목록·자동 확인 간격을 모든 기기에 한 번에 바꾸고 싶다
>
> 그림으로 된 설명: [예전 매뉴얼 PDF](../manual/teacher-manual-advanced.pdf)

## 준비물

GitHub 계정, Vercel 계정(둘 다 무료), 그리고 [교사용 작업 지시서](교사용-작업지시서.md) 1단계의 구글 설문지·시트.

## ① 버튼 한 번으로 사이트 열기

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FParkdongbae%2Fschool-3d-artcenter&project-name=school-artcenter&repository-name=school-artcenter&env=ADMIN_PASSWORD&envDescription=F9%20%EA%B4%80%EB%A6%AC%20%ED%99%94%EB%A9%B4%EA%B3%BC%20%EC%82%AC%EC%9D%B4%ED%8A%B8%20%EC%84%A4%EC%A0%95%20%EC%A0%80%EC%9E%A5%EC%97%90%20%EC%93%B8%20%EA%B4%80%EB%A6%AC%EC%9E%90%20%EB%B9%84%EB%B0%80%EB%B2%88%ED%98%B8%20(%ED%95%99%EC%83%9D%EC%9D%B4%20%EB%AA%A8%EB%A5%B4%EB%8A%94%20%EA%B2%83%EC%9C%BC%EB%A1%9C))

1. 위의 **Deploy** 버튼을 누릅니다.
2. Vercel 계정이 없으면 **Continue with GitHub**로 가입합니다.
3. 저장소 이름(Repository Name)을 정합니다. 예) `ourschool-art` — 사이트 주소가 됩니다.
4. **ADMIN_PASSWORD** 칸에 관리자 비밀번호를 적습니다. (학생이 모르는 것으로, 메모해 두세요)
5. **Deploy**를 누르고 1분 기다리면 `https://(이름).vercel.app` 주소가 생깁니다.

## ② 사이트에서 저장하기

1. 내 사이트를 열고 **우리 학교 전시관 만들기**를 누릅니다.
2. ②에 구글 시트 주소, ③에 전시 제목을 넣습니다.
3. 맨 아래 **고급: 직접 배포한 내 사이트(Vercel)에 저장하기**를 펼칩니다.
4. 처음 한 번은 **GitHub 접근 키**가 필요합니다. 화면의 안내 버튼을 차례로 누르세요:
   접근 키 만들기(미리 채워짐) → **Vercel 환경 변수 화면 열기** → **Add Environment Variable** → Key `GITHUB_TOKEN`, Value 붙여넣기 → **Save** → **Vercel 배포 화면 열기** → ⋯ → **Redeploy**
5. 관리자 비밀번호를 넣고 **저장하고 모든 기기에 적용** → 1~2분 뒤 새로고침.

## 🔑 관리자 비밀번호와 접근 키

| 이름 | 무엇인가요 | 어디에 |
|---|---|---|
| `ADMIN_PASSWORD` | 사이트 설정 저장·F9 관리 버튼을 누를 때 쓰는 비밀번호 | 배포할 때 입력 (Vercel → Settings → Environment Variables에서 바꿀 수 있음) |
| `GITHUB_TOKEN` | 사이트가 선생님 대신 GitHub에 설정·사진을 저장하도록 허락하는 열쇠 | 위 4번의 안내 버튼으로 만들어 Vercel 환경 변수에 저장 |

접근 키를 만들 때 꼭 확인할 것: **Repository access → Only select repositories → 내 저장소 하나**, 권한은 **Actions · Contents · Workflows: Read and write** (안내 버튼으로 열면 미리 채워져 있습니다). 키를 넣거나 바꾼 뒤에는 Vercel **Deployments → ⋯ → Redeploy**를 해야 적용됩니다.

## F9 관리 메뉴 (고급 설치에서만 보이는 것)

- **모든 기기 자동 확인**: 새 응답을 확인하는 간격을 바꾸거나 끕니다.
- **작품 사진 업데이트**: 사진을 작게 줄여 사이트에 저장합니다(학생이 많을 때 빨라집니다).
- **감상평 비속어 관리**: 걸러낼 단어를 더하거나 뺍니다.
- **감상평 웹 앱 주소 → 모든 기기에 적용**

## 문제가 생기면

- **저장 버튼에서 401 / 403 / 404** → 접근 키가 틀렸거나(401), 권한(Actions · Contents · Workflows 쓰기)이 부족하거나(403), 접근 키에 내 저장소를 선택하지 않았습니다(404).
- **우리 학교 사진이 원본 저장소로 가나요?** → 아니요. Deploy 버튼은 원본을 선생님 계정에 **새 저장소로 복사**합니다. 사진·설정은 그 저장소에만 저장됩니다.
- **원본이 바뀌면 내 사이트도 바뀌나요?** → 아니요. 복사본이라 그대로입니다.
