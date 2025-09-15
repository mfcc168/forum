export const zhTW = {
  // Navigation
  nav: {
    home: '首頁',
    wiki: '遊戲指南',
    blog: '最新消息',
    forum: '討論區',
    dex: '怪物圖鑑',
    serverName: '秘汐之嶼',
  },
  
  // General stats (shared across modules)
  stats: {
    onlineMembers: '在線成員',
    totalMembers: '總成員數',
  },
  
  // Authentication
  auth: {
    signIn: '登入',
    signOut: '登出',
    signInToPost: '登入以參與討論並與社群分享您的想法。',
    joinDiscussion: '加入討論',
    welcomeBack: '歡迎回來',
    signInToAccount: '登入您的帳戶',
    signingIn: '登入中...',
    signInWithDiscord: '使用 Discord 登入',
    joinCommunity: '加入社群'
  },

  // Home Page
  home: {
    title: '秘汐之嶼',
    subtitle: '1.21.8',
    description: '加入我們史詩般的生存世界，在最友善的 Minecraft 社群中建立您的傳奇。冒險、創造力和友誼在此等待著您！',
    serverStatus: '伺服器狀態：線上',
    joinServer: '立即加入伺服器',
    viewRules: '查看伺服器規則',
    
    stats: {
      onlinePlayers: '線上玩家',
      totalBuilds: '總建築數',
      activeGuilds: '活躍公會',
      serverUptime: '伺服器運行時間',
    },
    
    
    serverInfo: {
      title: '伺服器資訊',
      ip: '伺服器 IP：',
      version: '版本：',
      gameMode: '遊戲模式：',
      survival: '生存',
    },
    
    features: {
      title: '特色功能',
      economy: '進階經濟系統',
      shops: '玩家商店與交易',
      claims: '土地保護系統',
      events: '每週活動與競賽',
      community: '友善的社群',
    },
    
    quickActions: {
      title: '快速動作',
      downloadPack: '下載資源包',
      wiki: '伺服器指南',
      discord: '加入 Discord',
    },
    
    recentUpdates: {
      title: '最新更新',
      viewAll: '查看所有更新',
      updates: [
        {
          category: '更新',
          title: '全新出生點發布！',
          content: '查看我們全新的出生點區域，改進的商店和新手教學。',
          date: '2 天前',
        },
        {
          category: '經濟',
          title: '經濟系統更新',
          content: '商店新增物品和平衡調整，提供更好的遊戲體驗。',
          date: '1 週前',
        },
        {
          category: '活動',
          title: '冬季慶典開始！',
          content: '參加我們的冬季慶典活動，獲得獨家獎勵和特殊活動。',
          date: '2 週前',
        },
      ],
    },
  },
  
  // Wiki Page
  wiki: {
    title: '伺服器指南',
    subtitle: '您在我們 Minecraft 伺服器上的完整指南',
    pageTitle: '指南',
    pageDescription: '綜合指南和文檔',
    welcome: {
      title: '歡迎來到指南',
      description: '關於我們 Minecraft 伺服器的一切資訊！使用下面的分類來瀏覽指南、教學和重要資訊。點擊任何主題以了解更多。',
    },
    
    sections: {
      gettingStarted: '入門指南',
      gameplay: '遊戲玩法',
      features: '特色功能',
      community: '社群',
    },
    
    descriptions: {
      gettingStarted: '新玩家開始冒險的必要指南',
      gameplay: '核心機制、系統和遊戲功能',
      features: '特殊伺服器功能和獨特內容',
      community: '社群功能、活動和社群準則',
    },
    
    difficulty: {
      beginner: '初學者',
      intermediate: '中級',
      advanced: '高級',
    },
    
    stats: {
      guides: '指南',
      guide: '指南',
      views: '瀏覽',
      totalViews: '總瀏覽數',
      authors: '作者',
      contributors: '貢獨者',
      categories: '分類',
    },
    
    searchPlaceholder: '搜尋指南...',
    searchResultsFor: '搜尋結果',
    clearSearch: '清除搜尋',
    searchError: '搜尋指南失敗',
    noGuidesFound: '找不到相關指南',
    searchSuggestion: '請嘗試不同的關鍵字或瀏覽下方分類',
    
    viewAll: '查看全部',
    views: '次瀏覽',
    noDescription: '暫無描述',
    noGuidesInCategory: '此分類暫無指南',
    createFirstGuide: '建立第一個指南',
    createNewGuide: '建立新指南',
    
    joinDescription: '登入以貢獻指南、提問並幫助其他玩家的旅程',
    signInToContribute: '登入以貢獻',
    noGuidesYet: '尚無指南',
    checkBackSoon: '請稍後再回來查看有用的指南！',
    
    gettingStartedItems: [
      '如何加入伺服器',
      '新手入門指南',
      '基本指令',
      '伺服器規則',
    ],
    
    gameplayItems: [
      '經濟系統',
      '土地保護',
      '玩家商店',
      '職業系統',
    ],
    
    featuresItems: [
      '自訂物品',
      '特殊活動',
      '地牢與突襲',
      'PvP 區域',
    ],
    
    communityItems: [
      '城鎮與城市',
      '公會系統',
      '玩家排名',
      'Discord 整合',
    ],
    
    featuredGuide: {
      title: '精選指南',
      howToJoin: '如何加入伺服器',
      description: '加入我們的伺服器很簡單！按照這些簡單步驟開始您的冒險，成為我們amazing社群的一份子。',
      steps: [
        {
          title: '啟動 Minecraft',
          description: '開啟 Minecraft Java 版 1.21.8 或更新版本',
        },
        {
          title: '進入多人遊戲',
          description: '從主選單點選「多人遊戲」',
        },
        {
          title: '新增伺服器',
          description: '輸入我們的伺服器 IP：',
        },
        {
          title: '加入並遊玩',
          description: '連接並開始您的冒險！',
        },
      ],
    },
    // Wiki guide titles
    howToJoinServer: '如何加入伺服器',
    newPlayerGuide: '新手入門指南',
    basicCommands: '基本指令',
    serverRules: '伺服器規則',
    economySystem: '經濟系統',
    landProtection: '土地保護',
    playerShops: '玩家商店',
    jobSystem: '職業系統',
    customItems: '自訂物品',
    specialEvents: '特殊活動',
    dungeonsRaids: '地牢與突襲',
    pvpAreas: 'PvP 區域',
    townsCities: '城鎮與城市',
    guildSystem: '公會系統',
    playerRankings: '玩家排名',
    discordIntegration: 'Discord 整合',
    detail: {
      loading: '載入指南中...',
      notFound: '找不到指南',
      notFoundDescription: '此指南在目前語言中不可用。',
      backToWiki: '← 返回知識庫',
      tableOfContents: '目錄',
      proTips: '💡 專業提示',
      importantWarnings: '⚠️ 重要警告',
      updated: '更新於',
      lastUpdated: '最後更新：',
      backToWikiFooter: '返回知識庫',
      estimatedTime: '預估閱讀時間'
    },
    
    categories: {
      gettingStarted: '新手入門',
      gameplay: '遊戲玩法',
      features: '特色功能',
      community: '社群',
      gettingStartedDesc: '新玩家開始旅程的必備指南',
      gameplayDesc: '核心機制、系統和遊戲玩法功能',
      featuresDesc: '特殊伺服器功能和獨特內容',
      communityDesc: '社交功能、活動和社群準則'
    },
    
    forms: {
      create: {
        title: '建立知識庫指南',
        description: '與社群分享你的知識',
        submitButton: '建立新指南'
      },
      createGuide: {
        title: '建立知識庫指南',
        description: '與社群分享你的知識',
        titleLabel: '標題',
        titlePlaceholder: '輸入指南標題...',
        contentLabel: '內容',
        contentPlaceholder: '在此撰寫你的指南內容...',
        excerptLabel: '摘要',
        excerptPlaceholder: '指南的簡短描述...',
        categoryLabel: '分類',
        categoryPlaceholder: '選擇一個分類',
        difficultyLabel: '難度',
        difficultyPlaceholder: '選擇難度等級',
        tagsLabel: '標籤（選填）',
        tagsPlaceholder: '輸入標籤，以逗號分隔（選填）',
        tagsHelp: '新增相關標籤以幫助玩家找到你的指南',
        estimatedTimeLabel: '預估閱讀時間',
        estimatedTimePlaceholder: '例如：5 分鐘',
        statusLabel: '狀態',
        submit: '建立指南',
        cancel: '取消'
      },
      edit: {
        title: '編輯知識庫指南',
        description: '更新您的指南內容和詳細資訊'
      },
      editGuide: {
        title: '編輯知識庫指南',
        submit: '更新指南'
      },
      errors: {
        titleRequired: '標題為必填',
        contentRequired: '內容為必填',
        excerptRequired: '摘要為必填',
        categoryRequired: '分類為必填',
        difficultyRequired: '難度為必填'
      }
    },
    
    emptyState: {
      title: '未找到指南',
      description: '目前沒有指南可以顯示。',
      actionLabel: '建立指南'
    },
    
    status: {
      draft: '草稿',
      published: '已發布',
      archived: '已封存'
    },
    
    actions: {
      createGuide: '建立指南',
      editGuide: '編輯指南',
      deleteGuide: '刪除指南',
      edit: '編輯',
      delete: '刪除',
      deleting: '刪除中...',
      confirmDelete: '確定要刪除這個知識庫指南嗎？',
      confirmDeleteTitle: '刪除指南',
      confirmDeleteMessage: '確定要刪除這個知識庫指南嗎？',
      deleteSuccess: '知識庫指南已成功刪除',
      creating: '建立中...',
      editing: '更新中...',
      helpful: '有幫助',
      like: '喜歡',
      bookmark: '書籤',
      share: '分享'
    }
  },
  
  
  // Blog Page
  blog: {
    title: '伺服器消息',
    subtitle: '掌握最新消息、活動和社群精彩內容',
    pageTitle: '最新消息',
    pageDescription: '來自我們 Minecraft 伺服器的最新消息、更新和公告',
    readTime: '分鐘閱讀',
    loading: '載入消息文章中...',
    categoriesTitle: '按分類瀏覽',
    posts: '總文章數',
    totalViews: '總瀏覽數',
    post: {
      readMore: '查看更多',
    },
    categoryNames: {
      all: '全部',
      announcement: '公告',
      update: '更新',
      guide: '指南',
      event: '活動',
      community: '社群',
      general: '一般',
    },
    welcome: {
      title: '社群消息',
      description: '掌握最新的伺服器消息、更新和社群公告',
    },
    categories: [
      { name: '更新', description: '伺服器更新與改進', posts: 12 },
      { name: '活動', description: '伺服器活動與慶祝', posts: 8 },
      { name: '社群', description: '玩家焦點與社群新聞', posts: 15 }
    ],
    likes: '個讚',
    comments: '則留言',
    readMore: '閱讀更多',
    loadMore: '載入更多文章',
    emptyState: {
      noPosts: '未找到消息文章',
      noPostsInCategory: '在 "{category}" 分類中未找到消息文章',
      checkBack: '稍後再來查看新內容！'
    },
    list: {
      noPosts: '沒有可用的消息文章',
      endOfPosts: '您已經瀏覽完所有文章'
    },
    search: {
      noResults: '未找到符合搜尋條件的文章'
    },
    adminNotice: {
      title: '注意事項',
      description: '消息文章僅由管理員發布。這是一個專供社群更新和資訊的只讀消息區。'
    },
    featured: {
      category: '精選',
      title: '精選文章',
      description: '精選描述',
      date: '發布日期',
      readTime: '閱讀時間'
    },
    recent: {
      title: '最新文章'
    },
    actions: {
      title: '操作',
      editPost: '編輯文章',
      deletePost: '刪除文章',
      edit: '編輯',
      delete: '刪除',
      deleting: '刪除中...',
      confirmDelete: '您確定要刪除此消息文章嗎？此操作無法復原。',
      confirmDeleteTitle: '刪除文章',
      confirmDeleteMessage: '您確定要刪除此消息文章嗎？此操作無法復原。',
      deleteSuccess: '消息文章刪除成功',
      deleteFailed: '刪除消息文章失敗',
      networkError: '網路錯誤',
      createFirst: '發布您的第一篇文章！',
      like: '喜歡',
      bookmark: '書籤',
      share: '分享'
    },
    stats: {
      post: '篇文章',
      posts: '總文章數', 
      totalViews: '總瀏覽數',
      categories: '個分類',
      authors: '位作者',
      published: '發布日期',
      views: '次觀看',
      likes: '個讚',
      author: '作者',
      readMore: '閱讀更多'
    },
    filter: {
      title: '按分類篩選',
      allPosts: '所有文章',
      featuredPost: '精選文章',
      latestPost: '最新文章'
    },
    navigation: {
      backToBlog: '返回消息區',
      home: '首頁',
      newPost: '新文章'
    },
    sidebar: {
      categories: '分類',
      blogStats: '消息統計',
      totalPosts: '總文章數',
      exploreMore: '探索更多',
      allBlogPosts: '所有消息文章',
      communityForum: '社群討論區',
      serverWiki: '伺服器百科',
      articleInfo: '文章資訊',
      viewAllPosts: '查看所有文章'
    },
    form: {
      createPost: '建立消息文章',
      editPost: '編輯消息文章',
      createDescription: '為社群撰寫新的消息文章',
      editDescription: '編輯您的消息文章',
      title: '標題',
      titlePlaceholder: '輸入消息文章標題',
      category: '分類',
      status: '狀態',
      statusPublished: '已發布',
      statusDraft: '草稿',
      statusArchived: '已封存',
      excerpt: '摘要',
      excerptPlaceholder: '消息文章的簡短描述',
      characters: '字元',
      content: '內容',
      contentPlaceholder: '在此撰寫您的消息文章內容...',
      tags: '標籤（選填）',
      tagsPlaceholder: '公告, 更新, 指南',
      tagsHelp: '使用逗號分隔多個標籤',
      updatePost: '更新文章',
      creating: '建立中...',
      updating: '更新中...',
      errors: {
        adminOnly: '只有管理員可以建立消息文章',
        fillRequired: '請填入所有必填欄位',
        submitFailed: '提交消息文章失敗',
        accessDenied: '存取被拒絕',
        adminRequired: '只有管理員可以建立消息文章。如需發布內容，請聯絡管理員。'
      }
    },
    meta: {
      author: '作者',
      tags: '標籤'
    },
    forms: {
      create: {
        title: '建立消息文章',
        description: '為社群撰寫新的消息文章',
        titleLabel: '標題',
        titlePlaceholder: '輸入消息文章標題',
        titleRequired: '標題為必填項目',
        excerptLabel: '摘要',
        excerptPlaceholder: '消息文章的簡短描述（顯示在消息清單中）',
        excerptDescription: '這將作為消息清單中的預覽文字（最多 500 個字元）',
        excerptRequired: '摘要為必填項目',
        categoryLabel: '類別',
        categoryPlaceholder: '選擇類別',
        categoryRequired: '請選擇類別',
        contentLabel: '內容',
        contentPlaceholder: '在此撰寫您的消息文章內容...',
        contentRequired: '內容為必填項目',
        tagsLabel: '標籤',
        tagsPlaceholder: '公告、更新、指南、活動、社群',
        tagsHelp: '標籤幫助讀者找到相關內容',
        tagsDescription: '以逗號分隔多個標籤（例如：公告、伺服器更新、指南）',
        statusLabel: '狀態',
        statusPublished: '已發布',
        statusDraft: '草稿',
        statusArchived: '已封存',
        statusHelp: '已發布的文章對所有使用者可見',
        categoryHelp: '為此消息文章選擇最合適的分類',
        submitCreate: '建立消息文章',
        submitEdit: '更新消息文章',
        creating: '建立中...',
        editing: '更新中...',
        submitButton: '建立消息文章',
        submitting: '建立中...',
        cancel: '取消',
        adminOnly: '只有管理員可以建立消息文章。',
        success: '消息文章建立成功！',
        error: '建立消息文章失敗'
      },
      edit: {
        title: '編輯消息文章',
        description: '更新您的消息文章內容和詳細資訊'
      }
    }
  },
  
  // Forum Page
  forum: {
    title: '伺服器討論區',
    subtitle: '與社群聯繫，分享您的建築，獲得幫助',
    pageTitle: '💬 討論區',
    pageDescription: '與我們的社群聯繫，分享您的 Minecraft 體驗',
    post: {
      readMore: '閱讀更多',
      showMore: '顯示更多',
      showLess: '顯示較少',
      pinned: '置頂',
      locked: '鎖定',
      author: '作者'
    },
    welcome: {
      title: '歡迎來到我們的討論區',
      description: '參與討論，提出問題，與其他玩家分享您的 Minecraft 冒險。我們的社群在這裡幫助您充分利用伺服器體驗。'
    },
    categoryNames: {
      'General Discussion': '一般討論',
      'Server Updates & News': '伺服器更新與消息',
      'Building & Showcases': '建築與展示',
      // Slug-based keys for compatibility
      'general-discussion': '一般討論',
      'server-updates-news': '伺服器更新與消息',
      'building-showcases': '建築與展示'
    },
    backToForum: '返回討論區',
    createNewPost: '建立新貼文',
    postsTitle: '討論區貼文',
    emptyState: {
      noPostsFound: '未找到貼文',
      noPostsInCategory: '在 "{category}" 中未找到貼文',
      firstToDiscuss: '成為第一個開始討論的人！',
      noPosts: '尚無貼文',
      checkBack: '稍後再來查看新討論'
    },
    postCard: {
      pinned: '置頂',
      locked: '鎖定',
      by: '作者',
      lastReply: '最後回覆',
      likes: '個讚',
      replies: '則回覆',
      views: '次瀏覽',
      more: '更多'
    },
    actions: {
      like: '讚',
      bookmark: '收藏',
      share: '分享',
      linkCopied: '連結已複製到剪貼簿！',
      createPost: '建立貼文',
      createFirstPost: '建立第一則貼文',
      createFirst: '開始討論',
      editPost: '編輯貼文',
      edit: '編輯',
      delete: '刪除',
      deleting: '刪除中...',
      confirmDeleteTitle: '刪除貼文',
      confirmDeleteMessage: '您確定要刪除此貼文嗎？此操作無法復原。'
    },
    stats: {
      totalTopics: '話題',
      totalPosts: '貼文',
      totalViews: '總瀏覽數',
      onlineNow: '線上',
      members: '會員'
    },
    categories: {
      title: '分類',
      names: {
        'General Discussion': '一般討論',
        'Server Updates & News': '伺服器更新與新聞',
        'Building & Showcases': '建築與展示',
      }
    },
    recent: {
      title: '最新討論'
    },
    postDetail: {
      buttons: {
        reply: '回覆',
        edit: '編輯',
        delete: '刪除',
        deleting: '刪除中...',
        writeReply: '撰寫回覆'
      },
      sidebar: {
        author: '作者',
        member: '會員',
        posts: '貼文',
        joined: '加入時間',
        lastActive: '最後活動'
      },
      noReplies: {
        title: '尚無回覆',
        subtitle: '成為第一個回覆的人！'
      },
      replyActions: {
        edit: '編輯',
        delete: '刪除',
        reply: '回覆',
        bookmark: '儲存',
        save: '儲存',
        saving: '儲存中...',
        cancel: '取消',
        editPlaceholder: '編輯您的回覆...'
      }
    },
    forms: {
      createPost: {
        title: '建立新貼文',
        description: '與社群分享您的想法',
        titleLabel: '標題',
        titlePlaceholder: '您想討論什麼呢？',
        categoryLabel: '分類',
        categoryPlaceholder: '選擇分類',
        categoryHelp: '為您的貼文選擇最相關的分類',
        contentLabel: '內容',
        contentPlaceholder: '分享您的想法、提出問題或開始討論...',
        tagsLabel: '標籤',
        tagsPlaceholder: 'minecraft、教學、幫助（選填）',
        tagsHelp: '標籤幫助其他使用者找到您的貼文。最多 10 個標籤。',
        submitCreate: '建立貼文',
        submitEdit: '更新貼文',
        creating: '建立中...',
        editing: '更新中...',
        cancel: '取消',
        titleRequired: '標題為必填項目',
        categoryRequired: '請選擇分類',
        contentRequired: '內容為必填項目'
      },
      editPost: {
        title: '編輯貼文',
        subtitle: '更新您的貼文內容和詳細資訊',
        description: '更新您的貼文內容和詳細資訊',
        submitButton: '更新貼文',
        submitting: '更新中...',
        cancel: '取消'
      },
      replyForm: {
        placeholder: '撰寫您的回覆...',
        replyToPlaceholder: '回覆 {username}...',
        replyingTo: '回覆 {username}',
        submitButton: '發布回覆',
        submitting: '發布中...',
        cancel: '取消',
        contentRequired: '回覆內容為必填項目',
        loginRequired: '您必須登入才能回覆'
      }
    },
    filter: {
      title: '依分類篩選',
      allPosts: '所有貼文',
      pinnedPost: '置頂貼文'
    },
    sidebar: {
      categories: '分類',
      viewAllPosts: '查看所有貼文'
    },
    memberNotice: {
      title: '參與討論',
      description: '登入以參與討論並與社群分享您的想法。'
    }
  },

  // Dex (Monster) Page
  dex: {
    title: '怪物圖鑑',
    subtitle: '探索我們 Minecraft 伺服器中的所有生物',
    pageTitle: '怪物圖鑑',
    pageDescription: '探索我們 Minecraft 伺服器中的所有生物',
    welcome: {
      title: '怪物圖鑑',
      description: '探索我們伺服器中的怪物與生物'
    },
    
    stats: {
      monsters: '怪物總數',
      totalViews: '總瀏覽量',
      author: '作者',
      created: '建立時間',
      views: '瀏覽量',
      likes: '喜歡數'
    },
    
    search: {
      placeholder: '搜尋怪物...'
    },
    
    filters: {
      allCategories: '所有分類'
    },
    
    results: {
      showing: '顯示',
      of: '共',
      monsters: '怪物'
    },
    
    empty: {
      title: '找不到怪物',
      description: '請調整搜尋條件或篩選器以尋找更多怪物。'
    },
    
    categories: {
      title: '分類',
      hostile: '敵對',
      passive: '被動',
      neutral: '中立',
      boss: '頭目'
    },
    
    elements: {
      none: '無',
      fire: '火',
      water: '水',
      earth: '土',
      air: '風',
      light: '光',
      dark: '暗',
      ice: '冰',
      lightning: '雷'
    },
    
    races: {
      god: '神',
      dragon: '龍',
      goblin: '哥布林',
      orc: '獸人',
      elf: '精靈',
      dwarf: '矮人',
      troll: '巨魔',
      giant: '巨人',
      undead: '不死族',
      skeleton: '骷髏',
      zombie: '殭屍',
      vampire: '吸血鬼',
      ghost: '幽靈',
      demon: '惡魔',
      angel: '天使',
      fairy: '妖精',
      phoenix: '鳳凰',
      beast: '野獸',
      wolf: '狼',
      bear: '熊',
      cat: '貓',
      bird: '鳥',
      fish: '魚',
      snake: '蛇',
      spider: '蜘蛛',
      insect: '昆蟲',
      slime: '史萊姆',
      golem: '魔像',
      construct: '構造體',
      robot: '機器人',
      elemental: '元素',
      plant: '植物',
      humanoid: '人形',
      alien: '外星人',
      void: '虛無'
    },
    
    spawning: {
      common: '常見',
      uncommon: '不常見',
      rare: '稀有',
      legendary: '傳說'
    },
    
    worlds: {
      overworld: '主世界',
      nether: '地獄',
      end: '終界',
      magic: '魔界',
      heaven: '天界',
      dungeon: '副本'
    },
    
    timeOfDay: {
      day: '白天',
      night: '夜晚',
      any: '任意時間'
    },
    
    detail: {
      combatStats: '戰鬥數據',
      health: '血量',
      damage: '傷害',
      speed: '速度',
      xpDrop: '經驗值',
      behaviors: '行為',
      spawningInfo: '生成資訊',
      worlds: '世界',
      biomes: '生態系',
      structures: '結構',
      conditions: '條件',
      time: '時間',
      light: '光照',
      rarity: '稀有度',
      drops: '掉落物',
      chance: '機率',
      quantity: '數量',
      loading3d: '載入 3D 模型中...',
      model3d: '3D 模型'
    },
    
    forms: {
      create: {
        title: '建立怪物',
        description: '新增生物至怪物圖鑑',
        submitButton: '建立怪物',
        nameLabel: '怪物名稱',
        namePlaceholder: '輸入怪物名稱...',
        modelLabel: '3D 模型',
        modelPlaceholder: '選擇 3D 模型...',
        modelHelp: '從可用的 GLTF 模型中選擇',
        categoryLabel: '分類',
        elementLabel: '屬性',
        raceLabel: '種族',
        excerptLabel: '摘要',
        excerptPlaceholder: '怪物的簡短描述...',
        descriptionLabel: '描述',
        descriptionPlaceholder: '描述怪物的能力和特徵...',
        healthHelp: '怪物血量',
        damageHelp: '怪物傷害',
        xpDropHelp: '被擊殺時掉落的經驗值',
        biomesPlaceholder: '平原, 森林, 沙漠...',
        biomesHelp: '怪物生成的生態系 (逗號分隔)',
        structuresPlaceholder: '地牢, 要塞, 村莊...',
        structuresHelp: '怪物生成的特定結構 (逗號分隔)',
        lightLevelMinLabel: '最低光照等級',
        lightLevelMinHelp: '最低光照等級 (0-15)',
        lightLevelMaxLabel: '最高光照等級',
        lightLevelMaxHelp: '最高光照等級 (0-15)',
        timeOfDayLabel: '時間',
        spawnRateLabel: '生成頻率',
        behaviorsLabel: '行為',
        behaviorsPlaceholder: '攻擊性, 領域性, 飛行...',
        behaviorsHelp: '怪物行為 (逗號分隔)',
        tagsLabel: '標籤',
        tagsPlaceholder: '頭目, 火焰, 地獄...',
        tagsHelp: '用逗號分隔相關標籤',
        statusLabel: '狀態'
      },
      edit: {
        title: '編輯怪物',
        description: '更新怪物詳細資訊'
      },
      errors: {
        nameRequired: '怪物名稱為必填',
        modelRequired: '請選擇 3D 模型',
        categoryRequired: '分類為必填',
        descriptionRequired: '描述為必填',
        healthRequired: '血量為必填',
        damageRequired: '傷害為必填',
        speedRequired: '速度為必填',
        xpRequired: '經驗值為必填'
      }
    },
    
    biomes: {
      // Overworld Biomes 主世界生態系
      plains: '平原',
      forest: '森林',
      birch_forest: '樺木森林',
      dark_forest: '黑暗森林',
      old_growth_birch_forest: '原始樺木森林',
      old_growth_pine_taiga: '原始松木針葉林',
      old_growth_spruce_taiga: '原始雲杉針葉林',
      taiga: '針葉林',
      snowy_taiga: '積雪針葉林',
      savanna: '草原',
      savanna_plateau: '草原高原',
      windswept_hills: '風蝕丘陵',
      windswept_gravelly_hills: '風蝕砂礫丘陵',
      windswept_forest: '風蝕森林',
      windswept_savanna: '風蝕草原',
      jungle: '叢林',
      sparse_jungle: '稀疏叢林',
      bamboo_jungle: '竹林',
      desert: '沙漠',
      swamp: '沼澤',
      mangrove_swamp: '紅樹林沼澤',
      mushroom_fields: '蘑菇島',
      ice_spikes: '冰刺平原',
      snowy_plains: '積雪平原',
      snowy_slopes: '積雪坡地',
      frozen_peaks: '凍結山峰',
      jagged_peaks: '尖峭山峰',
      stony_peaks: '石質山峰',
      meadow: '草甸',
      grove: '雪林',
      cherry_grove: '櫻花樹林',
      stony_shore: '石岸',
      beach: '海灘',
      snowy_beach: '積雪海灘',
      ocean: '海洋',
      deep_ocean: '深海',
      lukewarm_ocean: '溫水海洋',
      deep_lukewarm_ocean: '溫水深海',
      warm_ocean: '暖水海洋',
      cold_ocean: '冷水海洋',
      deep_cold_ocean: '冷水深海',
      frozen_ocean: '凍海',
      deep_frozen_ocean: '凍結深海',
      river: '河流',
      frozen_river: '凍河',
      dripstone_caves: '鐘乳石洞',
      lush_caves: '繁茂洞穴',
      deep_dark: '深暗之域',
      // Nether Biomes 地獄生態系
      nether_wastes: '地獄荒地',
      soul_sand_valley: '靈魂沙峽谷',
      crimson_forest: '緋紅森林',
      warped_forest: '詭異森林',
      basalt_deltas: '玄武岩三角洲',
      // End Biomes 終界生態系
      the_end: '終界',
      small_end_islands: '終界小島',
      end_midlands: '終界中地',
      end_highlands: '終界高地',
      end_barrens: '終界荒地'
    },
    
    structures: {
      // Generated Structures 生成結構
      village: '村莊',
      desert_pyramid: '沙漠神殿',
      igloo: '雪屋',
      jungle_pyramid: '叢林神殿',
      swamp_hut: '沼澤小屋',
      pillager_outpost: '掠奪者前哨站',
      mansion: '林地府邸',
      monument: '海底神殿',
      stronghold: '要塞',
      mineshaft: '廢棄礦坑',
      dungeon: '地牢',
      buried_treasure: '埋藏的寶藏',
      shipwreck: '沈船',
      ocean_ruin: '海底遺跡',
      ruined_portal: '廢棄傳送門',
      ancient_city: '古代城市',
      trail_ruins: '古徑廢墟',
      // Nether Structures 地獄結構
      nether_fortress: '地獄要塞',
      bastion_remnant: '堡壘遺跡',
      // End Structures 終界結構
      end_city: '終界城'
    },
    
    actions: {
      like: '喜歡',
      bookmark: '收藏',
      share: '分享',
      favorite: '最愛',
      edit: '編輯',
      delete: '刪除',
      deleting: '刪除中...',
      confirmDeleteTitle: '刪除怪物',
      confirmDeleteMessage: '確定要刪除這隻怪物嗎？此操作無法復原。',
      deleteSuccess: '怪物刪除成功',
      createMonster: '建立怪物',
      editMonster: '編輯怪物',
      deleteMonster: '刪除怪物',
      viewMonster: '查看怪物',
      backToDex: '返回圖鑑',
      title: '操作'
    },
    
    navigation: {
      backToDex: '返回圖鑑',
      home: '首頁',
      newMonster: '新增怪物'
    },
    
    sidebar: {
      exploreMore: '探索更多',
      allMonsters: '所有怪物',
      communityForum: '社群論壇',
      serverWiki: '伺服器指南',
      monsterInfo: '怪物資訊'
    },
    
    adminNotice: {
      title: '僅限管理員',
      description: '只有管理員可以建立和編輯怪物。如需新增內容請聯繫管理員。'
    },
    
    meta: {
      author: '作者',
      tags: '標籤'
    },
    
    emptyState: {
      title: '找不到怪物',
      description: '建立您的第一隻怪物來開始使用',
      createFirst: '建立第一隻怪物'
    },
    
    categoryNames: {
      common: '常見',
      elite: '精英',
      boss: '頭目',
      rare: '稀有',
      legendary: '傳說',
      npc: 'NPC'
    }
  },

  // Common UI elements
  common: {
    loading: '載入中...',
    error: '發生錯誤',
    retry: '重試',
    login: '登入',
    bookmark: '儲存',
    cancel: '取消',
    delete: '刪除',
    edit: '編輯',
    back: '返回',
    next: '下一個',
    previous: '上一個',
    submit: '提交',
    loadingServerData: '載入伺服器資料中...',
    createPost: '建立貼文',
    all: '全部',
    allPosts: '所有文章',
    posts: '貼文',
    postCreatedSuccessfully: '貼文建立成功！',
    postDeletedSuccessfully: '貼文刪除成功',
    replyCreatedSuccessfully: '回覆發布成功！',
    searchPlaceholder: '搜尋...',
    noResults: '無搜尋結果',
    tryDifferentTerms: '請嘗試不同的搜尋條件',
    clear: '清除',
    replyUpdatedSuccessfully: '回覆更新成功！',
    replyDeletedSuccessfully: '回覆刪除成功！',
    networkError: '網路連線錯誤',
    unableToCopyLink: '無法複製連結至剪貼簿',
    loadingMore: '載入更多...',
    tryAgain: '重試',
    errorLoadingPosts: '載入文章時發生錯誤',
    
    // Confirmation dialogs
    confirmations: {
      deletePost: {
        title: '刪除貼文',
        message: '您確定要刪除此貼文嗎？此操作無法復原。',
        confirm: '刪除',
        cancel: '取消'
      },
      deleteReply: {
        title: '刪除回覆',
        message: '您確定要刪除此回覆嗎？此操作無法復原。',
        confirm: '刪除',
        cancel: '取消'
      }
    },
  },

  // WYSIWYG Editor
  editor: {
    prompts: {
      enterUrl: '輸入網址：',
      enterImageUrl: '輸入圖片網址：'
    }
  },

  // 404 Not Found Page
  notFound: {
    title: '找不到頁面',
    description: '抱歉，您要尋找的頁面不存在或已被移動。',
    goHome: '返回首頁'
  }
}
