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
      title: "ChatSurvey",
      subtitle: "Co-create with AI",
      createDescription: "Design professional surveys through intelligent conversation",
      signInToCreate: "Sign in to create surveys",
      startCreate: "Create Survey",
      viewDashboard: "Management Center",
      signedInAs: "Signed in as",
      signOut: "Sign out",
      takeDescription: "Enter survey code or link to participate",
      surveyCodePlaceholder: "Survey code (e.g., A7B2) or link",
      startFill: "Start Survey",
      enterCodeError: "Please enter a valid survey code or link",
      footer: "Intelligent Surveys · Actionable Insights",
    },

    // Create page
    create: {
      title: "Create Survey",
      welcomeMessage:
        "Welcome to the Survey Design Assistant.\n\nPlease describe your survey requirements, and I will generate a professional questionnaire for you.\n\n**Common Templates:**\n- 📊 Employee Satisfaction Survey\n- 🎯 360-Degree Performance Review\n- 🏢 Organizational Culture Assessment\n- 👥 Team Collaboration Evaluation\n- 💼 Onboarding Experience Feedback\n- 🚀 Training Effectiveness Survey\n\n**Survey Specifications:**\n- 21-28 professionally designed questions\n- Multiple question types (rating, single choice, multiple choice, open-ended, etc.)\n- Logical question sequencing\n\n**Editing Features:**\n- Modify questions directly in the preview panel\n- Add or remove questions as needed\n- Drag to reorder questions\n\nPlease describe your survey requirements.",
      questionsCount: "questions",
      surveyCreated:
        "Survey created successfully. Details below:\n\n**Survey Code:** {shortCode}\n\n**Survey Link:** {surveyUrl}\n\nPlease save this information for future survey management and data access.",
      errorMessage: "An error occurred. Please try again.",
      inputPlaceholder: "Enter your requirements...",
      suggestedPrompts: [
        "Employee satisfaction survey",
        "Product experience feedback",
        "Event participant feedback",
        "Customer service quality review",
      ],
    },

    // Survey preview
    preview: {
      emptyTitle: "Survey Preview",
      emptyDescription: "Survey content will appear here",
      emptyHint: "Start a conversation to create your survey",
      generating: "Generating Survey...",
      generatingHint: "System is creating your survey",
      updating: "Updating...",
      surveyTitle: "Survey Title",
      surveyDescription: "Survey Description",
      untitled: "Untitled Survey",
      addQuestion: "Add Question",
      deleteQuestion: "Delete",
      dragToReorder: "Drag to reorder",
      questionTypes: {
        text: "Text",
        multiple_choice: "Single Choice",
        multi_select: "Multiple Choice",
        dropdown: "Dropdown",
        rating: "Rating",
        slider: "Slider",
        yes_no: "Yes/No",
        date: "Date",
        number: "Number",
        email: "Email",
        phone: "Phone",
      },
      required: "Required",
      optional: "Optional",
      addOption: "Add option",
      optionPlaceholder: "Option text",
      viewSurvey: "Preview Survey",
      surveyFinalized: "Survey Published",
      editDisabled: "Editing not available after publication",
      finalize: "Save Draft",
      finalizing: "Saving...",
      updateSurvey: "Update Draft",
      surveyUpdated: "Draft saved",
    },

    // Survey page
    survey: {
      notFound: "Survey not found",
      loadFailed: "Failed to load survey",
      notAccepting: "Thank you for your interest. This survey has concluded and is no longer accepting responses. Please contact the survey administrator if you have any questions.",
      welcomeMessage:
        "Thank you for participating in this survey.\n\n**Question 1 of {total}:**\n{question}",
      submitFailed: "Submission failed",
      submitFailedMessage: "Survey submission failed. Please check your connection and try again.",
      loadingSurvey: "Loading survey...",
      thankYou: "Thank you for taking the time to complete this survey. Your feedback is invaluable to us and will be carefully reviewed to help improve our work. We appreciate your participation and support.",
      completed: "Submitted Successfully",
      inputPlaceholder: "Enter your response...",
      submitAnswer: "Submit",
      orEnterAnswer: "Or enter your response here...",
    },

    // Dashboard
    dashboard: {
      title: "Survey Management Center",
      enterNameLabel: "Enter administrator name",
      namePlaceholder: "Your name or employee ID",
      viewSurveys: "View Surveys",
      name: "Administrator:",
      dataAnalysis: "Data Analysis",
      createSurvey: "New Survey",
      loadingSurveys: "Loading...",
      noSurveysFound: "No surveys found for this administrator",
      createFirst: "Create your first survey",
      hideClosed: "Hide completed",
      filterAll: "All",
    },

    // Analytics
    analytics: {
      needCreatorName: "Administrator access required",
      accessFromDashboard: "Please access analytics from the Management Center",
      returnToDashboard: "Return to Management Center",
      loadingData: "Loading data...",
      title: "Data Analysis Assistant",
      noSurveys: "No data available",
      welcomeMessage:
        "Welcome to the Data Analysis Assistant.\n\nCurrently analyzing: **{title}**\n\nI can assist you with:\n- Response statistics overview\n- Answer distribution by question\n- Data trends and insights\n\nExample queries:\n- \"Analyze the response distribution for each question\"\n- \"Which options received the most responses?\"\n- \"What is the survey completion rate?\"",
      statsOverview: "Data Overview",
      totalResponses: "Total Responses",
      completed: "Completed",
      completionRate: "Completion Rate",
      todayNew: "New Today",
      selectSurvey: "Select a survey from the top right to begin analysis",
      noSurveyData: "No data available",
      analysisError: "An error occurred during analysis. Please try again.",
      inputPlaceholder: "Enter your question...",
      selectFirst: "Please select a survey first",
      analyzing: "Analyzing...",
      share: "Share",
      shareTitle: "Share Analytics Report",
      shareDescription: "Anyone with the link can view this report and chat with the AI analyst",
      copyLink: "Copy Link",
      linkCopied: "Link copied!",
      statsPanel: "Data Summary",
      question: "Question",
      option: "Option",
      count: "Count",
      percentage: "Percentage",
      expandDetails: "View Details",
      collapseDetails: "Hide Details",
      answer: "Answer",
      time: "Time",
      noResponses: "No responses yet",
      partial: "Partial",
    },

    // Mode selectors
    modes: {
      createSurvey: "Create Survey",
      takeSurvey: "Take Survey",
      totalQuestions: "{count} questions total",
      formMode: "Form Mode",
      formModeDesc: "View and complete all questions at once",
      chatMode: "Guided Mode",
      chatModeDesc: "Step-by-step question guidance",
      startSurvey: "Start Survey",
    },

    // Survey card
    card: {
      draft: "Draft",
      active: "Active",
      closed: "Completed",
      activate: "Publish",
      close: "Close",
      reopen: "Reopen",
      edit: "Edit",
      analyze: "Analyze",
      exportCSV: "Export Data",
      copyLink: "Copy Link",
      completedResponses: "Completed",
      partialResponses: "Partial",
      inProgressResponses: "In Progress",
    },

    // Form response
    form: {
      required: "This question is required",
      confirmEarlySubmit: "Confirm Partial Submission",
      aboutToSubmit: "You are about to submit an incomplete survey:",
      answeredQuestions: "Answered",
      unansweredQuestions: "Unanswered",
      cannotModify: "Responses cannot be modified after submission. Proceed?",
      continueFilling: "Continue Survey",
      confirmSubmit: "Confirm Submit",
      submitting: "Submitting...",
      submitSurvey: "Submit Survey",
      earlySubmit: "Submit Early ({answered}/{total} answered)",
    },

    // Chat interface
    chat: {
      aiThinking: "Processing...",
      aiLabel: "Assistant",
      designerLabel: "Design Assistant",
      assistantLabel: "Assistant",
      analystLabel: "Analysis Assistant",
      youLabel: "You",
    },

    // Question input
    question: {
      typeAnswer: "Enter your response...",
      enterNumber: "Enter a number...",
      enterDate: "Select a date...",
      enterEmail: "Enter email address...",
      enterPhone: "Enter phone number...",
      selectOption: "Select...",
      confirmSelection: "Confirm",
      confirmValue: "Confirm",
      yes: "Yes",
      no: "No",
    },

    // Verification
    verification: {
      title: "Security Verification",
      description: "Please complete verification to continue",
      verifying: "Verifying...",
      failed: "Verification failed. Please try again",
      error: "Verification error. Please refresh the page",
      expired: "Verification expired. Please try again",
    },
  },

  zh: {
    // Common
    loading: "加载中...",
    send: "发送",
    retry: "重试",
    returnHome: "返回首页",
    questions: "道题目",
    responses: "份回复",

    // Home page
    home: {
      title: "畅谈问卷",
      subtitle: "与AI共创",
      createDescription: "通过智能对话快速设计专业问卷",
      signInToCreate: "登录以创建问卷",
      startCreate: "创建问卷",
      viewDashboard: "管理中心",
      signedInAs: "当前账号",
      signOut: "退出登录",
      takeDescription: "请输入问卷编号或扫描链接参与调研",
      surveyCodePlaceholder: "问卷编号（如：A7B2）或链接",
      startFill: "开始填写",
      enterCodeError: "请输入有效的问卷编号或链接",
      footer: "智能驱动 · 高效调研",
    },

    // Create page
    create: {
      title: "创建问卷",
      welcomeMessage:
        "您好，欢迎使用问卷设计助手。\n\n请告诉我您希望创建的问卷主题，我将为您生成一份专业的调研问卷。\n\n**常用模板：**\n- 📊 员工满意度调查\n- 🎯 360度绩效评估\n- 🏢 组织文化诊断\n- 👥 团队协作评估\n- 💼 入职体验反馈\n- 🚀 培训效果评估\n\n**问卷规格：**\n- 21-28 道专业设计的题目\n- 多元题型支持（评分、单选、多选、开放题等）\n- 科学的题目编排逻辑\n\n**编辑功能：**\n- 在右侧预览面板直接修改题目内容\n- 删除或新增题目\n- 拖拽调整题目顺序\n\n请描述您的调研需求。",
      questionsCount: "道题目",
      surveyCreated:
        "问卷创建成功，详细信息如下：\n\n**问卷编号：** {shortCode}\n\n**问卷链接：** {surveyUrl}\n\n请妥善保存以上信息，以便后续在管理中心查看数据报表。",
      errorMessage: "系统处理时遇到问题，请稍后重试。",
      inputPlaceholder: "请输入您的需求...",
      suggestedPrompts: [
        "员工满意度调查，约20道题",
        "新产品使用体验反馈",
        "活动参与者意见收集",
        "客户服务质量评价",
      ],
    },

    // Survey preview
    preview: {
      emptyTitle: "问卷预览",
      emptyDescription: "问卷内容将在此处显示",
      emptyHint: "开始对话以创建问卷",
      generating: "正在生成问卷...",
      generatingHint: "系统正在为您创建问卷",
      updating: "正在更新...",
      surveyTitle: "问卷标题",
      surveyDescription: "问卷说明",
      untitled: "未命名问卷",
      addQuestion: "添加题目",
      deleteQuestion: "删除",
      dragToReorder: "拖动排序",
      questionTypes: {
        text: "文本题",
        multiple_choice: "单选题",
        multi_select: "多选题",
        dropdown: "下拉选择",
        rating: "评分题",
        slider: "滑块题",
        yes_no: "是否题",
        date: "日期题",
        number: "数字题",
        email: "邮箱",
        phone: "电话",
      },
      required: "必答",
      optional: "选答",
      addOption: "添加选项",
      optionPlaceholder: "选项内容",
      viewSurvey: "预览问卷",
      surveyFinalized: "问卷已发布",
      editDisabled: "问卷发布后暂不支持编辑",
      finalize: "保存草稿",
      finalizing: "保存中...",
      updateSurvey: "更新草稿",
      surveyUpdated: "草稿已保存",
    },

    // Survey page
    survey: {
      notFound: "问卷不存在",
      loadFailed: "问卷加载失败",
      notAccepting: "感谢您的关注。本次调研已结束，问卷暂停收集。如有疑问，请联系问卷发起人。",
      welcomeMessage:
        "您好，感谢您参与本次调研。\n\n**第 1 题 / 共 {total} 题：**\n{question}",
      submitFailed: "提交失败",
      submitFailedMessage: "问卷提交失败，请检查网络后重试。",
      loadingSurvey: "正在加载问卷...",
      thankYou: "感谢您抽出宝贵时间完成本次调研。您的反馈对我们非常重要，我们将认真分析每一份回复，持续改进工作。再次感谢您的支持与配合！",
      completed: "提交成功",
      inputPlaceholder: "请输入您的回答...",
      submitAnswer: "提交",
      orEnterAnswer: "或在此输入回答...",
    },

    // Dashboard
    dashboard: {
      title: "问卷管理中心",
      enterNameLabel: "请输入管理员名称",
      namePlaceholder: "您的姓名或工号",
      viewSurveys: "查看问卷",
      name: "管理员：",
      dataAnalysis: "数据分析",
      createSurvey: "新建问卷",
      loadingSurveys: "正在加载...",
      noSurveysFound: "暂无关联的问卷记录",
      createFirst: "创建您的第一份问卷",
      hideClosed: "隐藏已结束",
      filterAll: "全部",
    },

    // Analytics
    analytics: {
      needCreatorName: "需要管理员身份",
      accessFromDashboard: "请从管理中心进入数据分析",
      returnToDashboard: "返回管理中心",
      loadingData: "正在加载数据...",
      title: "数据分析助手",
      noSurveys: "暂无数据",
      welcomeMessage:
        "您好，我是数据分析助手。\n\n当前分析问卷：**{title}**\n\n我可以协助您进行以下分析：\n- 回复数据统计概览\n- 各题目回答分布情况\n- 数据趋势与洞察\n\n您可以这样提问：\n- 请分析各题目的回答分布\n- 哪些选项最受关注？\n- 问卷完成率如何？",
      statsOverview: "数据概览",
      totalResponses: "回复总数",
      completed: "已完成",
      completionRate: "完成率",
      todayNew: "今日新增",
      selectSurvey: "请从右上角选择需要分析的问卷",
      noSurveyData: "暂无数据",
      analysisError: "数据分析时遇到问题，请稍后重试。",
      inputPlaceholder: "请输入您的问题...",
      selectFirst: "请先选择问卷",
      analyzing: "正在分析...",
      share: "分享",
      shareTitle: "分享分析报告",
      shareDescription: "任何有链接的人都可以查看此报告并与 AI 分析师对话",
      copyLink: "复制链接",
      linkCopied: "链接已复制！",
      statsPanel: "数据汇总",
      question: "题目",
      option: "选项",
      count: "数量",
      percentage: "占比",
      expandDetails: "查看详情",
      collapseDetails: "收起详情",
      answer: "回答",
      time: "时间",
      noResponses: "暂无回复",
      partial: "部分完成",
    },

    // Mode selectors
    modes: {
      createSurvey: "创建问卷",
      takeSurvey: "填写问卷",
      totalQuestions: "共 {count} 道题目",
      formMode: "表单模式",
      formModeDesc: "一次性查看并填写所有题目",
      chatMode: "对话模式",
      chatModeDesc: "逐题引导式填写",
      startSurvey: "开始填写",
    },

    // Survey card
    card: {
      draft: "草稿",
      active: "进行中",
      closed: "已结束",
      activate: "发布",
      close: "结束",
      reopen: "重新开放",
      edit: "编辑",
      analyze: "分析",
      exportCSV: "导出数据",
      copyLink: "复制链接",
      completedResponses: "已完成",
      partialResponses: "部分",
      inProgressResponses: "进行中",
    },

    // Form response
    form: {
      required: "此题为必答题",
      confirmEarlySubmit: "确认提前提交",
      aboutToSubmit: "您即将提交未完整填写的问卷：",
      answeredQuestions: "已回答",
      unansweredQuestions: "未回答",
      cannotModify: "提交后将无法修改，确认继续？",
      continueFilling: "继续填写",
      confirmSubmit: "确认提交",
      submitting: "提交中...",
      submitSurvey: "提交问卷",
      earlySubmit: "提前提交（已答 {answered}/{total}）",
    },

    // Chat interface
    chat: {
      aiThinking: "正在处理...",
      aiLabel: "助手",
      designerLabel: "设计助手",
      assistantLabel: "助手",
      analystLabel: "分析助手",
      youLabel: "我",
    },

    // Question input
    question: {
      typeAnswer: "请输入您的回答...",
      enterNumber: "请输入数字...",
      enterDate: "请选择日期...",
      enterEmail: "请输入邮箱地址...",
      enterPhone: "请输入联系电话...",
      selectOption: "请选择...",
      confirmSelection: "确认",
      confirmValue: "确认",
      yes: "是",
      no: "否",
    },

    // Verification
    verification: {
      title: "安全验证",
      description: "请完成验证后继续",
      verifying: "验证中...",
      failed: "验证失败，请重试",
      error: "验证出错，请刷新页面重试",
      expired: "验证已过期，请重新验证",
    },
  },
};

// Type for the translation structure (not const to allow both languages)
export type TranslationKeys = typeof translations.en;
export type Translations = typeof translations;
