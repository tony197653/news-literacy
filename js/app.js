const defaultQuestions = [
	{
		id: 1,
		topic: "閱讀理解",
		news: "市立圖書館宣布，暑假期間將在三個分館延長開館時間至晚間九點。館方表示，去年暑假晚間入館人次比平日增加約兩成，因此今年先試辦兩個月，並會依使用情形評估是否延長。",
		question: "根據這則消息，圖書館延長開館時間的原因與後續安排為何？",
		options: {
			A: "因為所有分館都已經確定永久延長營業時間。",
			B: "去年暑假晚間使用人數增加，因此先試辦並觀察成效。",
			C: "因為學生要求增加自習座位，所以立刻增設新分館。",
			D: "圖書館將依照平日白天的人次決定是否縮短時間。"
		},
		answer: "B",
		explanation: "新聞說明去年暑假晚間入館人次增加約兩成，所以今年先在三個分館試辦兩個月，再依使用情形評估。A 把試辦誤讀成永久措施；C、D 都不是新聞提到的原因或安排。"
	},
	{
		id: 2,
		topic: "事實查核",
		news: "社群平台近日流傳「喝某種茶可以在一週內改善近視」的貼文，貼文沒有附上研究來源。眼科醫師提醒，視力變化可能與用眼習慣、檢查方式等因素有關，民眾應詢問專業人員，不要只憑網路貼文自行調整治療。",
		question: "如果想查證貼文宣稱的效果，下列哪一種做法最可靠？",
		options: {
			A: "查看貼文有多少人按讚，再判斷可信度。",
			B: "找出研究原文與作者，並確認研究方法及專業機構說明。",
			C: "搜尋其他內容相同的轉貼，確認很多人都看過。",
			D: "先購買產品試用，若感覺有效就代表貼文正確。"
		},
		answer: "B",
		explanation: "查核健康資訊應追溯原始研究，確認作者、研究方法與專業機構的說明。按讚數和轉貼數不能證明內容正確；個人感受也無法取代有對照、可檢驗的證據。"
	},
	{
		id: 3,
		topic: "邏輯推理",
		news: "某校調查發現，參加午休閱讀活動的學生，這學期平均借書量比上學期增加。報告同時指出，本學期圖書館新增了漫畫與科普書，且調查沒有比較未參加活動學生的借書變化。",
		question: "只根據目前的調查，哪一個結論最合理？",
		options: {
			A: "午休閱讀活動一定是借書量增加的唯一原因。",
			B: "新增書籍可能也有影響，還需要更多資料才能判斷活動效果。",
			C: "沒有參加活動的學生，借書量一定比以前減少。",
			D: "只要增加漫畫，所有學生的閱讀能力就會提升。"
		},
		answer: "B",
		explanation: "借書量上升與閱讀活動同時發生，但新增書籍也可能帶來影響，且缺少未參加活動學生的比較資料，因此不能確認唯一原因。B 保留了合理可能性，也指出還需要更多證據。"
	}
];

const questionList = document.querySelector("#question-list");
const quizForm = document.querySelector("#quiz-form");
const scorePanel = document.querySelector("#score-panel");
const questionCount = document.querySelector("#question-count");
const quizProgress = document.querySelector("#quiz-progress");
const progressFill = document.querySelector("#progress-fill");
const submitHint = document.querySelector("#submit-hint");
const uploadMessage = document.querySelector("#upload-message");
const questionBankInput = document.querySelector("#question-bank-json");
let questions = defaultQuestions;
let submitted = false;

function escapeHTML(value) {
	return String(value).replace(/[&<>"']/g, (character) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;"
	})[character]);
}

function renderQuestions() {
	questionCount.textContent = String(questions.length).padStart(2, "0");
	scorePanel.hidden = true;
	questionList.innerHTML = questions.map((item, index) => {
		const options = ["A", "B", "C", "D"].map((letter) => `
			<label class="option-label" data-option-label="${letter}">
				<input type="radio" name="question-${index}" value="${letter}" aria-label="第 ${index + 1} 題選項 ${letter}" />
				<span class="option-letter">${letter}</span>
				<span>${escapeHTML(item.options[letter])}</span>
			</label>
		`).join("");

		return `
			<article class="question-card" data-question-index="${index}">
				<div class="question-topline">
					<span class="question-index">QUESTION / ${String(index + 1).padStart(2, "0")}</span>
					<span class="topic-tag">${escapeHTML(item.topic || "新聞素養")}</span>
				</div>
				<p class="news-label">新聞摘讀</p>
				<p class="news-copy">${escapeHTML(item.news)}</p>
				<p class="question-prompt">${escapeHTML(item.question)}</p>
				<div class="options-list">${options}</div>
			</article>
		`;
	}).join("");

	submitted = false;
	submitHint.textContent = "每題選一個答案，再查看你的閱讀雷達。";
	updateProgress();
}

function updateProgress() {
	const answered = questions.reduce((total, _item, index) => (
		total + (quizForm.querySelector(`input[name="question-${index}"]:checked`) ? 1 : 0)
	), 0);
	quizProgress.innerHTML = `作答進度 <strong>${answered} / ${questions.length}</strong>`;
	progressFill.style.width = `${questions.length ? (answered / questions.length) * 100 : 0}%`;
}

function showResults() {
	let score = 0;
	const explanations = [];

	questions.forEach((item, index) => {
		const card = questionList.querySelector(`[data-question-index="${index}"]`);
		const selected = card.querySelector("input:checked")?.value;
		const correct = selected === item.answer;
		if (correct) score += 1;

		card.querySelectorAll(".option-label").forEach((label) => {
			const letter = label.dataset.optionLabel;
			const input = label.querySelector("input");
			input.disabled = true;
			label.classList.add("is-locked");
			if (letter === item.answer) label.classList.add("is-correct");
			if (letter === selected && !correct) label.classList.add("is-wrong");
			if (letter === selected && correct) label.classList.add("is-selected");
		});

		explanations.push(`
			<p class="answer-note"><strong>第 ${index + 1} 題・${correct ? "答對" : `正確答案 ${item.answer}`}：</strong>${escapeHTML(item.explanation || "回到新聞內容，找出支持正確選項的線索。")}</p>
		`);
	});

	const scoreMessage = score === questions.length
		? "觀察得很仔細！記得繼續追問資訊是怎麼來的。"
		: score > 0
			? "做得不錯，看看解析裡有哪些線索可以幫助你再多想一步。"
			: "別急著下結論，讀讀解析，再回到新聞找找看關鍵線索。";

	scorePanel.innerHTML = `
		<div class="score-line"><span class="score-number">${score} / ${questions.length}</span><strong>題答對</strong></div>
		<p class="score-message">${scoreMessage}</p>
		${explanations.join("")}
	`;
	scorePanel.hidden = false;
	submitHint.textContent = "已完成批改，正確線索已標示在各題選項中。";
	submitted = true;
	scorePanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function isValidQuestionBank(value) {
	if (!Array.isArray(value) || value.length === 0) return false;
	return value.every((item) => (
		item &&
		typeof item.news === "string" && item.news.trim() &&
		typeof item.question === "string" && item.question.trim() &&
		item.options &&
		["A", "B", "C", "D"].every((letter) => (
			typeof item.options[letter] === "string" && item.options[letter].trim()
		)) &&
		["A", "B", "C", "D"].includes(item.answer)
	));
}

quizForm.addEventListener("change", (event) => {
	if (event.target.matches('input[type="radio"]') && !submitted) {
		const card = event.target.closest(".question-card");
		card.querySelectorAll(".option-label").forEach((label) => label.classList.remove("is-selected"));
		event.target.closest(".option-label").classList.add("is-selected");
		updateProgress();
	}
});

quizForm.addEventListener("submit", (event) => {
	event.preventDefault();
	if (submitted) return;
	const unanswered = questions.filter((_item, index) => (
		!quizForm.querySelector(`input[name="question-${index}"]:checked`)
	)).length;
	if (unanswered > 0) {
		submitHint.textContent = `還有 ${unanswered} 題尚未作答；仍可提交並查看完整解析。`;
	}
	showResults();
});

document.querySelectorAll(".mode-button").forEach((button) => {
	button.addEventListener("click", () => {
		const isPractice = button.dataset.view === "practice";
		document.querySelector("#practice-view").hidden = !isPractice;
		document.querySelector("#upload-view").hidden = isPractice;
		document.querySelectorAll(".mode-button").forEach((modeButton) => {
			const active = modeButton === button;
			modeButton.classList.toggle("is-active", active);
			if (active) modeButton.setAttribute("aria-current", "page");
			else modeButton.removeAttribute("aria-current");
		});
	});
});

document.querySelector("#load-bank-button").addEventListener("click", () => {
	try {
		const parsed = JSON.parse(questionBankInput.value);
		if (!isValidQuestionBank(parsed)) {
			throw new Error("題庫格式不完整。每題需包含 news、question、A-D 四個 options，以及 A-D 其中一個 answer。");
		}
		questions = parsed;
		renderQuestions();
		uploadMessage.textContent = `載入成功，共 ${questions.length} 題。已切換至練習頁。`;
		uploadMessage.classList.remove("is-error");
		uploadMessage.classList.add("is-success");
		document.querySelector('[data-view="practice"]').click();
		window.scrollTo({ top: 0, behavior: "smooth" });
	} catch (error) {
		uploadMessage.textContent = `無法載入：${error.message}`;
		uploadMessage.classList.remove("is-success");
		uploadMessage.classList.add("is-error");
	}
});

renderQuestions();
