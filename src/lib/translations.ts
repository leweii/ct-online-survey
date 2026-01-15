export type Language = "en" | "zh";

export const translations = {
  en: {
    // Common
    loading: "Loading...",
    send: "Send",
    retry: "Retry",
    returnHome: "Return to Home",
    questions: "questions",
    responses: "responses",

    // Home page
    home: {
      title: "Survey Assistant",
      subtitle: "Create and fill surveys through natural conversations",
      creatorNameLabel: "Your Creator Name",
      creatorNamePlaceholder: "Enter a name to remember your surveys",
      creatorNameHint: "This name will be used when creating surveys and viewing your dashboard",
      createDescription: "Design your survey through AI conversation",
      startCreate: "Start Creating",
      viewDashboard: "View Dashboard",
      takeDescription: "Enter survey code or link to start filling",
      surveyCodePlaceholder: "Survey code (e.g., A7B2) or link",
      startFill: "Start Filling",
      enterCodeError: "Please enter survey code or link",
      enterNameError: "Please enter your creator name",
      footer: "Powered by AI for a smooth survey experience",
    },

    // Create page
    create: {
      title: "Create Survey",
      welcomeMessage:
        'Hello! I\'m your survey design assistant. Please describe your survey topic (e.g., "Restaurant Customer Satisfaction Survey"), and I\'ll generate a complete professional survey with 21-28 questions for your review. You can remove questions as needed.',
      questionsCount: "questions",
      surveyCreated:
        "Survey created successfully! Here are the details:\n\n**Survey Code:** {shortCode}\n\n**Survey Link:** {surveyUrl}\n\n**Creator Name:** {creatorName}\n\nPlease save your creator name to access your dashboard and response data later.",
      errorMessage: "Sorry, encountered an issue. Please try again.",
      inputPlaceholder: "Enter your reply...",
    },

    // Survey page
    survey: {
      notFound: "Survey not found",
      loadFailed: "Failed to load survey",
      notAccepting: "This survey is currently not accepting responses",
      welcomeMessage:
        "Hello! Let's start the survey.\n\n**Question 1 / {total}:**\n{question}",
      submitFailed: "Submit failed",
      submitFailedMessage: "Survey submission failed, please try again.",
      loadingSurvey: "Loading survey...",
      thankYou: "Thank you for completing the survey! Your answers have been saved.",
      completed: "Survey completed!",
      inputPlaceholder: "Enter your answer...",
      submitAnswer: "Submit Answer",
      orEnterAnswer: "Or enter your answer here...",
    },

    // Dashboard
    dashboard: {
      title: "Creator Dashboard",
      enterNameLabel: "Enter your creator name",
      namePlaceholder: "Your creator name",
      viewSurveys: "View Surveys",
      name: "Name:",
      dataAnalysis: "Data Analysis",
      createSurvey: "Create Survey",
      loadingSurveys: "Loading surveys...",
      noSurveysFound: "No surveys found for this creator name",
      createFirst: "Create your first survey",
    },

    // Analytics
    analytics: {
      needCreatorName: "Creator name required",
      accessFromDashboard: "Please access the analytics page from the dashboard",
      returnToDashboard: "Return to Dashboard",
      loadingData: "Loading data...",
      title: "Data Analysis Assistant",
      noSurveys: "No surveys",
      welcomeMessage:
        "Hello! I'm your data analysis assistant.\n\nCurrently analyzing survey: **{title}**\n\nI can help you analyze:\n- Survey response statistics\n- Answer distribution for each question\n- Data trend analysis\n\nTry asking me:\n- \"What's the answer distribution for each question?\"\n- \"What are the most popular options?\"\n- \"What's the completion rate?\"",
      statsOverview: "Statistics Overview",
      totalResponses: "Total Responses",
      completed: "Completed",
      completionRate: "Completion Rate",
      todayNew: "Today's New",
      selectSurvey: "Please select a survey from the top right for analysis",
      noSurveyData: "No survey data yet",
      analysisError: "Sorry, encountered an issue while analyzing data. Please try again.",
      inputPlaceholder: "Enter your question...",
      selectFirst: "Please select a survey first",
      analyzing: "Analyzing data...",
    },

    // Mode selectors
    modes: {
      createSurvey: "Create Survey",
      takeSurvey: "Take Survey",
      totalQuestions: "Total {count} questions",
      formMode: "Form Mode",
      formModeDesc: "Fill all questions at once in traditional form format",
      chatMode: "Chat Mode",
      chatModeDesc: "Answer questions one by one with AI guidance",
    },

    // Survey card
    card: {
      draft: "Draft",
      active: "Active",
      closed: "Closed",
      activate: "Activate",
      close: "Close",
      exportCSV: "Export CSV",
      copyLink: "Copy Link",
    },

    // Form response
    form: {
      required: "This field is required",
      confirmEarlySubmit: "Confirm Early Submission",
      aboutToSubmit: "You are about to submit a partially filled survey:",
      answeredQuestions: "Answered questions",
      unansweredQuestions: "Unanswered questions",
      cannotModify: "Once submitted, answers cannot be modified. Are you sure?",
      continueFilling: "Continue Filling",
      confirmSubmit: "Confirm Submit",
      submitting: "Submitting...",
      submitSurvey: "Submit Survey",
      earlySubmit: "Early Submit ({answered}/{total} answered)",
    },

    // Chat interface
    chat: {
      aiThinking: "AI is thinking...",
    },

    // Question input
    question: {
      typeAnswer: "Type your answer...",
      enterNumber: "Enter a number...",
      enterDate: "Enter a date...",
      yes: "Yes",
      no: "No",
    },
  },

  zh: {
    // Common
    loading: "加载中...",
    send: "发送",
    retry: "重试",
    returnHome: "返回首页",
    questions: "个问题",
    responses: "条回复",

    // Home page
    home: {
      title: "问卷助手",
      subtitle: "通过自然对话创建和填写问卷",
      creatorNameLabel: "您的创建者名称",
      creatorNamePlaceholder: "输入名称以记住您的问卷（如：胖墩墩）",
      creatorNameHint: "输入名称后，创建问卷和查看仪表盘时将使用此名称",
      createDescription: "通过 AI 对话来设计您的问卷",
      startCreate: "开始创建",
      viewDashboard: "查看仪表盘",
      takeDescription: "输入问卷代码或链接开始填写",
      surveyCodePlaceholder: "问卷代码（如：A7B2）或链接",
      startFill: "开始填写",
      enterCodeError: "请输入问卷代码或链接",
      enterNameError: "请输入您的创建者名称",
      footer: "由 AI 驱动，提供流畅的问卷体验",
    },

    // Create page
    create: {
      title: "创建问卷",
      welcomeMessage:
        "您好！我是您的问卷设计助手。请描述您的问卷主题（例如：\"餐厅顾客满意度调查\"），我会为您生成一套包含 21-28 个问题的完整专业问卷供您审阅，您可以根据需要删减问题。",
      questionsCount: "个问题",
      surveyCreated:
        "问卷已创建成功！以下是详细信息：\n\n**问卷代码：** {shortCode}\n\n**问卷链接：** {surveyUrl}\n\n**创建者名称：** {creatorName}\n\n请妥善保存创建者名称，以便后续查看仪表盘和回复数据。",
      errorMessage: "抱歉，遇到了一些问题。请重试。",
      inputPlaceholder: "输入您的回复...",
    },

    // Survey page
    survey: {
      notFound: "未找到问卷",
      loadFailed: "加载问卷失败",
      notAccepting: "此问卷当前不接受回复",
      welcomeMessage:
        "您好！让我们开始问卷调查。\n\n**问题 1 / {total}：**\n{question}",
      submitFailed: "提交失败",
      submitFailedMessage: "问卷提交失败，请重试。",
      loadingSurvey: "加载问卷中...",
      thankYou: "感谢您完成问卷！您的回答已保存。",
      completed: "问卷已完成！",
      inputPlaceholder: "输入您的回答...",
      submitAnswer: "提交回答",
      orEnterAnswer: "或在此输入您的回答...",
    },

    // Dashboard
    dashboard: {
      title: "创建者仪表盘",
      enterNameLabel: "输入您的创建者名称",
      namePlaceholder: "您的创建者名称（如：胖墩墩）",
      viewSurveys: "查看问卷",
      name: "名称：",
      dataAnalysis: "数据分析",
      createSurvey: "创建问卷",
      loadingSurveys: "加载问卷中...",
      noSurveysFound: "未找到此创建者名称关联的问卷",
      createFirst: "创建您的第一份问卷",
    },

    // Analytics
    analytics: {
      needCreatorName: "需要创建者名称",
      accessFromDashboard: "请从仪表盘进入数据分析页面",
      returnToDashboard: "返回仪表盘",
      loadingData: "加载数据中...",
      title: "数据分析助手",
      noSurveys: "无问卷",
      welcomeMessage:
        "您好！我是数据分析助手。\n\n当前分析的问卷：**{title}**\n\n我可以帮您分析：\n- 问卷回复统计\n- 各问题的回答分布\n- 数据趋势分析\n\n您可以尝试问我：\n- \"各问题的回答分布如何？\"\n- \"最受欢迎的选项是什么？\"\n- \"回复完成率如何？\"",
      statsOverview: "统计概览",
      totalResponses: "回复总数",
      completed: "已完成",
      completionRate: "完成率",
      todayNew: "今日新增",
      selectSurvey: "请从右上角选择一个问卷进行分析",
      noSurveyData: "暂无问卷数据",
      analysisError: "抱歉，分析数据时遇到了问题。请重试。",
      inputPlaceholder: "输入您的问题...",
      selectFirst: "请先选择问卷",
      analyzing: "正在分析数据...",
    },

    // Mode selectors
    modes: {
      createSurvey: "创建问卷",
      takeSurvey: "填写问卷",
      totalQuestions: "共 {count} 个问题",
      formMode: "表单模式",
      formModeDesc: "以传统表单形式一次性填写所有问题",
      chatMode: "对话模式",
      chatModeDesc: "在 AI 引导下逐个回答问题",
    },

    // Survey card
    card: {
      draft: "草稿",
      active: "进行中",
      closed: "已关闭",
      activate: "激活",
      close: "关闭",
      exportCSV: "导出 CSV",
      copyLink: "复制链接",
    },

    // Form response
    form: {
      required: "此字段为必填项",
      confirmEarlySubmit: "确认提前提交",
      aboutToSubmit: "您即将提交部分填写的问卷：",
      answeredQuestions: "已回答问题",
      unansweredQuestions: "未回答问题",
      cannotModify: "提交后将无法修改，确定要继续吗？",
      continueFilling: "继续填写",
      confirmSubmit: "确认提交",
      submitting: "提交中...",
      submitSurvey: "提交问卷",
      earlySubmit: "提前提交 ({answered}/{total} 已回答)",
    },

    // Chat interface
    chat: {
      aiThinking: "AI 正在思考...",
    },

    // Question input
    question: {
      typeAnswer: "输入您的回答...",
      enterNumber: "输入数字...",
      enterDate: "选择日期...",
      yes: "是",
      no: "否",
    },
  },
};

// Type for the translation structure (not const to allow both languages)
export type TranslationKeys = typeof translations.en;
export type Translations = typeof translations;
