import os
import json
import requests
import streamlit as st

st.set_page_config(page_title="新聞素養題目練習", layout="centered")

st.markdown(
    """
    <style>
    .stApp { font-family: "Noto Sans TC", sans-serif; }
    .question-box {
        padding: 14px;
        border: 1px solid #e6e6e6;
        border-radius: 10px;
        background: #fbfbfd;
        margin-bottom: 12px;
    }
    .result-box {
        padding: 14px;
        border-radius: 10px;
        background: #f5f8ff;
        border: 1px solid #dfe7ff;
        margin-top: 16px;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

st.title("新聞素養題目練習")
st.caption("貼上新聞內容 → 產生題目 → 選答案 → 提交並看詳解")

news_text = st.text_area("請貼上新聞內容（繁體中文）", height=300)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")

def build_prompt(news):
    return f"""
你是國中教育測驗設計專家。請根據以下新聞內容，設計 3 題適合國中三年級學生的選擇題（繁體中文）。
重點：閱讀理解、事實查核、邏輯推理。

請確保每題都包含以下欄位：
- id
- type
- question
- options
- answer
- explanation

回傳格式必須是純 JSON，不能有額外文字，格式如下：
{
  "questions": [
    {
      "id": 1,
      "type": "閱讀理解",
      "question": "題目內容",
      "options": {"A":"選項A","B":"選項B","C":"選項C","D":"選項D"},
      "answer": "A",
      "explanation": "詳細解釋"
    }
  ]
}

新聞內容如下：
{news}
"""

def call_gemini(prompt):
    if not GEMINI_API_KEY:
        st.error("尚未設定 GEMINI_API_KEY。請先在終端機執行：setx GEMINI_API_KEY \"你的金鑰\"")
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2000
        }
    }

    try:
        resp = requests.post(url, json=payload, timeout=60)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        st.error(f"Gemini API 呼叫失敗：{e}")
        return None

def parse_questions(result):
    try:
        text = result["candidates"][0]["content"]["parts"][0]["text"]
        if text.startswith("```"):
            text = text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception:
        return None

if st.button("產生素養題目"):
    if not news_text.strip():
        st.warning("請先貼上新聞內容。")
    else:
        with st.spinner("產生題目中..."):
            prompt = build_prompt(news_text)
            result = call_gemini(prompt)
            if result is None:
                st.stop()

            data = parse_questions(result)
            if not data or "questions" not in data:
                st.error("Gemini 回傳格式錯誤，無法解析題目。")
                st.code(json.dumps(result, ensure_ascii=False, indent=2))
                st.stop()

            st.session_state["questions"] = data["questions"]
            st.session_state["answers"] = {str(q["id"]): "" for q in data["questions"]}
            st.success("題目已產生。請在下方作答。")

questions = st.session_state.get("questions", [])

if questions:
    with st.form("answer_form"):
        for q in questions:
            qid = str(q["id"])
            st.markdown(
                f"<div class='question-box'><b>第 {qid} 題（{q.get('type', '')}）</b><br>{q['question']}</div>",
                unsafe_allow_html=True
            )

            options = q["options"]
            choice = st.radio(
                "請選擇答案",
                [
                    f"A. {options.get('A','')}",
                    f"B. {options.get('B','')}",
                    f"C. {options.get('C','')}",
                    f"D. {options.get('D','')}",
                ],
                key=f"q_{qid}"
            )

            st.session_state["answers"][qid] = choice[0]

        submitted = st.form_submit_button("提交答案")

        if submitted:
            correct_count = 0

            for q in questions:
                qid = str(q["id"])
                student_answer = st.session_state["answers"].get(qid, "")
                correct_answer = q.get("answer", "").strip().upper()
                is_correct = student_answer == correct_answer

                if is_correct:
                    correct_count += 1

                st.markdown(f"### 題目 {qid} {'✅ 正確' if is_correct else '❌ 錯誤'}")
                st.markdown(f"你的答案：{student_answer or '未作答'}")
                st.markdown(f"正確答案：{correct_answer}")
                st.markdown(f"詳解：{q.get('explanation', '無詳解')}")
                st.markdown("---")

            st.markdown(
                f"<div class='result-box'><b>總分：{correct_count} / {len(questions)}</b></div>",
                unsafe_allow_html=True
            )