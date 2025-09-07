/**
 * Translation Types
 * 
 * Provides type safety for i18n translations across the application
 */

export interface TranslationStructure {
  common: {
    loading: string
    error: string
    success: string
    cancel: string
    confirm: string
    bookmark: string
    delete: string
    edit: string
    create: string
    update: string
    search: string
    searchPlaceholder: string
    noResults: string
    loadingServerData: string
    postCreatedSuccessfully: string
    postUpdatedSuccessfully: string
    postDeletedSuccessfully: string
  }
  
  home: {
    title: string
    subtitle: string
    description: string
    serverStatus: string
    joinServer: string
    viewRules: string
    
    stats: {
      onlinePlayers: string
      totalBuilds: string
      activeGuilds: string
      serverUptime: string
    }
    
    serverInfo: {
      title: string
      ip: string
      version: string
      gameMode: string
      survival: string
    }
    
    features: {
      title: string
      economy: string
      shops: string
      claims: string
      events: string
      community: string
    }
    
    quickActions: {
      title: string
      downloadPack: string
      wiki: string
      discord: string
    }
    
    recentUpdates: {
      title: string
      viewAll: string
      updates: Array<{
        category: string
        title: string
        content: string
        date: string
        description?: string
      }>
    }
  }
  
  forum: {
    title: string
    createPost: string
    categories: string
    latestPosts: string
    popularPosts: string
    noPostsInCategory: string
    postTitle: string
    postContent: string
    category: string
    tags: string
    publish: string
    draft: string
    replies: string
    views: string
    lastActivity: string
    pinnedPost: string
    lockedPost: string
    
    forms: {
      create: {
        title: string
        titleLabel: string
        titlePlaceholder: string
        contentLabel: string
        contentPlaceholder: string
        categoryLabel: string
        categoryPlaceholder: string
        tagsLabel: string
        tagsPlaceholder: string
        submitButton: string
        cancelButton: string
        saveDraft: string
      }
    }
  }
  
  blog: {
    title: string
    createPost: string
    latestPosts: string
    categories: string
    readMore: string
    publishedOn: string
    author: string
    tags: string
    relatedPosts: string
    
    forms: {
      create: {
        title: string
        titleLabel: string
        titlePlaceholder: string
        contentLabel: string
        contentPlaceholder: string
        excerptLabel: string
        excerptPlaceholder: string
        categoryLabel: string
        categoryPlaceholder: string
        tagsLabel: string
        tagsPlaceholder: string
        statusLabel: string
        featuredImageLabel: string
        submitButton: string
        cancelButton: string
        saveDraft: string
      }
    }
  }
  
  wiki: {
    title: string
    guides: string
    categories: string
    createGuide: string
    featuredGuides: string
    searchGuides: string
    difficulty: {
      beginner: string
      intermediate: string
      advanced: string
      expert: string
    }
    
    forms: {
      create: {
        title: string
        titleLabel: string
        titlePlaceholder: string
        contentLabel: string
        contentPlaceholder: string
        excerptLabel: string
        excerptPlaceholder: string
        categoryLabel: string
        categoryPlaceholder: string
        difficultyLabel: string
        estimatedTimeLabel: string
        tagsLabel: string
        tagsPlaceholder: string
        submitButton: string
        cancelButton: string
        saveDraft: string
      }
    }
  }
  
  auth: {
    signIn: string
    signOut: string
    signUp: string
    signInWith: string
    welcomeBack: string
    createAccount: string
    email: string
    password: string
    confirmPassword: string
    forgotPassword: string
    rememberMe: string
  }
  
  navigation: {
    home: string
    forum: string
    blog: string
    wiki: string
    login: string
    profile: string
    admin: string
    settings: string
  }
  
  errors: {
    pageNotFound: string
    serverError: string
    unauthorized: string
    forbidden: string
    validationFailed: string
    networkError: string
    tryAgain: string
    goHome: string
  }
  
  validation: {
    required: string
    emailInvalid: string
    passwordTooShort: string
    passwordsDontMatch: string
    titleTooShort: string
    titleTooLong: string
    contentTooShort: string
    contentTooLong: string
  }
}

/**
 * Translation key helper type for dot notation access
 */
export type TranslationKey = keyof TranslationStructure | 
  `${keyof TranslationStructure}.${string}` |
  `${keyof TranslationStructure}.${string}.${string}`

/**
 * Translation function type
 */
export interface TranslationFunction {
  <K extends keyof TranslationStructure>(key: K): TranslationStructure[K]
  <K extends keyof TranslationStructure, P extends keyof TranslationStructure[K] & string>(
    key: `${K}.${P}`
  ): TranslationStructure[K][P]
  (key: string): string
}

/**
 * Strongly typed translation context
 */
export interface TranslationContext {
  t: TranslationStructure
  currentLanguage: 'en' | 'zh-TW'
  setLanguage: (language: 'en' | 'zh-TW') => void
}