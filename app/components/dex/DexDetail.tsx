'use client';

import { useState, useCallback, memo } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { Icon } from '@/app/components/ui/Icon';
import { Card } from '@/app/components/ui/Card';
import { DexActions } from '@/app/components/dex/DexActions';
import { ModelViewer } from '@/app/components/dex/ModelViewer';
import { getDexCategoryColor } from '@/lib/config/dex-categories';
import { formatSimpleDate, formatNumber } from '@/lib/utils';
import type { DexMonster } from '@/lib/types';

interface DexDetailProps {
  monster: DexMonster;
  showActions?: boolean;
  showMeta?: boolean;
  layout?: 'card' | 'page';
  currentUserId?: string;
  onMonsterDeleted?: () => void;
}

export const DexDetail = memo(function DexDetail({ 
  monster, 
  showActions = true, 
  showMeta = true,
  layout = 'card',
  currentUserId: _currentUserId, // Reserved for future features
  onMonsterDeleted
}: DexDetailProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [imageError, setImageError] = useState(false);

  // Memoize category name translation
  const getCategoryName = useCallback((category: string | null | undefined) => {
    if (!category) return 'Unknown';
    const categoryNames = t.dex?.categoryNames || {};
    return categoryNames[category as keyof typeof categoryNames] || 
           (category.charAt(0).toUpperCase() + category.slice(1));
  }, [t.dex?.categoryNames]);

  // Memoize image error handler
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // Return full page layout for detail pages
  if (layout === 'page') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        {/* Header Section */}
        <div className="relative bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative max-w-7xl mx-auto px-6 py-8">
            {/* Breadcrumb */}
            <div className="mb-4">
              <Link 
                href="/dex" 
                className="inline-flex items-center space-x-2 text-purple-100 hover:text-white transition-colors"
              >
                <Icon name="chevronRight" className="w-4 h-4 rotate-180" />
                <span className="text-sm font-medium">{t.dex.navigation.backToDex}</span>
              </Link>
            </div>

            <div className="grid lg:grid-cols-4 gap-8 items-center">
              <div className="lg:col-span-3">
                {/* Category Badge */}
                <div className="mb-4">
                  <span className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full border border-white/30">
                    <span className="w-2 h-2 bg-purple-300 rounded-full mr-2"></span>
                    {getCategoryName(monster.category || 'monster')}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
                  {monster.name}
                </h1>

                {/* Excerpt */}
                <p className="text-lg text-purple-100 leading-relaxed">
                  {monster.excerpt}
                </p>

                {/* Monster Stats */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="text-sm text-purple-200">Health</div>
                    <div className="text-xl font-bold">{monster.stats.health}</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="text-sm text-purple-200">Damage</div>
                    <div className="text-xl font-bold">{monster.stats.damage}</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="text-sm text-purple-200">XP Drop</div>
                    <div className="text-xl font-bold">{monster.stats.xpDrop}</div>
                  </div>
                </div>
              </div>

              {/* Header Meta Info */}
              <div className="lg:col-span-1">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <Icon name="user" className="w-4 h-4 text-purple-200" />
                      <span className="text-purple-100">{monster.author?.name || 'Anonymous'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Icon name="clock" className="w-4 h-4 text-purple-200" />
                      <span className="text-purple-100">{formatSimpleDate(monster.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Icon name="eye" className="w-4 h-4 text-purple-200" />
                      <span className="text-purple-100">{formatNumber(monster.stats.viewsCount || 0)} views</span>
                    </div>
                    {(monster.stats?.likesCount || 0) > 0 && (
                      <div className="flex items-center space-x-2">
                        <Icon name="thumbsUp" className="w-4 h-4 text-purple-200" />
                        <span className="text-purple-100">{formatNumber(monster.stats?.likesCount || 0)} likes</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* 3D Model Viewer */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center space-x-3">
                    <Icon name="cube" className="w-6 h-6 text-purple-600" />
                    <span>3D Model</span>
                  </h2>
                </div>
                <div className="h-96 bg-gradient-to-br from-slate-50 to-gray-100">
                  <ModelViewer
                    modelPath={monster.modelPath}
                    modelScale={monster.modelScale}
                    cameraPosition={monster.camera?.position}
                    cameraLookAt={monster.camera?.lookAt}
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* Article Content */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
                <article className="p-8">
                  <div className="prose prose-xl prose-slate max-w-none">
                    {monster.description ? (
                      <div 
                        className="text-slate-700 leading-relaxed text-lg"
                        dangerouslySetInnerHTML={{ __html: monster.description }}
                      />
                    ) : (
                      <p className="text-slate-700 leading-relaxed text-lg">
                        {monster.excerpt || 'No description available'}
                      </p>
                    )}
                  </div>

                  {/* Monster Details */}
                  <div className="mt-12 pt-8 border-t border-slate-200">
                    <h3 className="text-xl font-semibold text-slate-800 mb-6">Monster Details</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-600">Element:</span>
                          <span className="font-semibold text-slate-800">{monster.element}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-600">Race:</span>
                          <span className="font-semibold text-slate-800">{monster.race}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-600">Spawn Rate:</span>
                          <span className="font-semibold text-slate-800">{monster.spawning.spawnRate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-600">World:</span>
                          <span className="font-semibold text-slate-800">{monster.spawning.worlds}</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-600">Health:</span>
                          <span className="font-semibold text-slate-800">{monster.stats.health} HP</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-600">Damage:</span>
                          <span className="font-semibold text-slate-800">{monster.stats.damage}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-600">XP Drop:</span>
                          <span className="font-semibold text-slate-800">{monster.stats.xpDrop} XP</span>
                        </div>
                        {monster.spawning.timeOfDay && (
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-600">Time of Day:</span>
                            <span className="font-semibold text-slate-800">{monster.spawning.timeOfDay}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Behaviors */}
                  {monster.behaviors && monster.behaviors.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <h3 className="text-xl font-semibold text-slate-800 mb-4">Behaviors</h3>
                      <div className="flex flex-wrap gap-2">
                        {monster.behaviors.map((behavior, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 text-sm font-medium rounded-full border border-purple-200/50"
                          >
                            {behavior}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags Section */}
                  {monster.tags && monster.tags.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <h3 className="text-xl font-semibold text-slate-800 mb-4">Tags</h3>
                      <div className="flex flex-wrap gap-3">
                        {monster.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 text-sm font-medium rounded-full border border-purple-200/50 hover:from-purple-100 hover:to-indigo-100 transition-all duration-200 cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></span>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              </div>

              {/* Standardized Actions */}
              <Card className="p-6 bg-white rounded-2xl shadow-xl border border-slate-200/50">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Icon name="user" className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{t.dex.actions.title}</h3>
                </div>
                <DexActions monster={monster} onDelete={onMonsterDeleted} />
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Navigation */}
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-xl border border-purple-200/50 sticky top-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <Icon name="link" className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{t.dex.sidebar.exploreMore}</h3>
                </div>
                <div className="space-y-3">
                  <Link 
                    href="/dex" 
                    className="flex items-center space-x-2 text-purple-700 hover:text-purple-800 transition-colors"
                  >
                    <Icon name="chevronRight" className="w-4 h-4" />
                    <span className="font-medium">{t.dex.sidebar.allMonsters}</span>
                  </Link>
                  <Link 
                    href="/forum" 
                    className="flex items-center space-x-2 text-purple-700 hover:text-purple-800 transition-colors"
                  >
                    <Icon name="chevronRight" className="w-4 h-4" />
                    <span className="font-medium">{t.dex.sidebar.communityForum}</span>
                  </Link>
                  <Link 
                    href="/wiki" 
                    className="flex items-center space-x-2 text-purple-700 hover:text-purple-800 transition-colors"
                  >
                    <Icon name="chevronRight" className="w-4 h-4" />
                    <span className="font-medium">{t.dex.sidebar.serverWiki}</span>
                  </Link>
                </div>
              </Card>

              {/* Notice for Regular Users */}
              {!session && (
                <Card className="p-6 bg-white rounded-2xl shadow-xl border border-slate-200/50">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                      <Icon name="star" className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">{t.dex.adminNotice.title}</h3>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {t.dex.adminNotice.description}
                  </p>
                </Card>
              )}

              {/* Monster Info Card */}
              <Card className="p-6 bg-white rounded-2xl shadow-xl border border-slate-200/50">
                <h3 className="text-lg font-bold text-slate-800 mb-4">{t.dex.sidebar.monsterInfo}</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    {monster.author?.avatar && !imageError ? (
                      <Image 
                        src={monster.author.avatar} 
                        alt={monster.author?.name || 'Anonymous'}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover shadow-sm"
                        onError={handleImageError}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {(monster.author?.name || 'Anonymous').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-800">{monster.author?.name || 'Anonymous'}</p>
                      <p className="text-sm text-slate-500">{t.dex.stats.author}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>{t.dex.stats.created}</span>
                      <span className="font-medium">{formatSimpleDate(monster.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t.dex.stats.views}</span>
                      <span className="font-medium">{formatNumber(monster.stats?.viewsCount || 0)}</span>
                    </div>
                    {(monster.stats?.likesCount || 0) > 0 && (
                      <div className="flex items-center justify-between">
                        <span>{t.dex.stats.likes}</span>
                        <span className="font-medium">{formatNumber(monster.stats?.likesCount || 0)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span>{t.dex.categories.title}</span>
                      <span className="font-medium">{getCategoryName(monster.category || 'monster')}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Return card layout for list views
  return (
    <article className="bg-white rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
      {/* Header */}
      <div className="p-8 pb-6">
        {/* Category Badge */}
        {monster.category && (
          <div className="mb-4">
            <span className={`inline-flex items-center px-4 py-2 text-sm font-semibold rounded-full ${
              getDexCategoryColor(monster.category).bg
            } ${
              getDexCategoryColor(monster.category).text
            }`}>
              <span className="w-2 h-2 bg-current rounded-full mr-2 opacity-75"></span>
              {getCategoryName(monster.category)}
            </span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 leading-tight mb-4">
          {monster.name}
        </h1>

        {/* Excerpt */}
        <p className="text-xl text-slate-600 leading-relaxed mb-6">
          {monster.excerpt}
        </p>

        {/* 3D Model Preview */}
        <div className="mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-slate-50 to-gray-100 h-48">
          <ModelViewer
            modelPath={monster.modelPath}
            modelScale={monster.modelScale}
            cameraPosition={monster.camera?.position}
            cameraLookAt={monster.camera?.lookAt}
            className="w-full h-full"
          />
        </div>

        {/* Meta Information */}
        {showMeta && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <div className="flex items-center space-x-4">
              {/* Author */}
              <div className="flex items-center space-x-3">
                {monster.author?.avatar && !imageError ? (
                  <Image 
                    src={monster.author.avatar!} 
                    alt={monster.author?.name || 'Unknown User'}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover shadow-sm"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {(monster.author?.name || 'Anonymous').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-800">{monster.author?.name || 'Anonymous'}</p>
                  <p className="text-sm text-slate-500">{t.dex.meta.author}</p>
                </div>
              </div>

              {/* Creation Date */}
              <div className="flex items-center space-x-2 text-slate-500">
                <Icon name="clock" className="w-4 h-4" />
                <span className="text-sm">
                  {formatSimpleDate(monster.createdAt)}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-4 text-sm text-slate-500">
              <div className="flex items-center space-x-1">
                <Icon name="eye" className="w-4 h-4" />
                <span>{formatNumber(monster.stats?.viewsCount || 0)}</span>
              </div>
              {(monster.stats?.likesCount || 0) > 0 && (
                <div className="flex items-center space-x-1">
                  <Icon name="thumbsUp" className="w-4 h-4" />
                  <span>{monster.stats?.likesCount || 0}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-8 pb-8">
        <div className="prose prose-xl prose-slate max-w-none">
          {monster.description ? (
            <div 
              className="text-slate-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: monster.description }}
            />
          ) : (
            <p className="text-slate-700 leading-relaxed text-lg">
              {monster.excerpt}
            </p>
          )}
        </div>

        {/* Monster Stats Grid */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200/50">
            <div className="text-xs font-medium text-red-600 uppercase tracking-wide">Health</div>
            <div className="text-2xl font-bold text-red-700">{monster.stats.health}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200/50">
            <div className="text-xs font-medium text-orange-600 uppercase tracking-wide">Damage</div>
            <div className="text-2xl font-bold text-orange-700">{monster.stats.damage}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200/50">
            <div className="text-xs font-medium text-green-600 uppercase tracking-wide">XP Drop</div>
            <div className="text-2xl font-bold text-green-700">{monster.stats.xpDrop}</div>
          </div>
        </div>

        {/* Tags */}
        {monster.tags && monster.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">
              {t.dex.meta.tags}
            </h3>
            <div className="flex flex-wrap gap-3">
              {monster.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 text-sm font-medium rounded-full border border-purple-200/50 hover:from-purple-100 hover:to-indigo-100 transition-all duration-200 cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></span>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <DexActions monster={monster} />
          </div>
        )}
      </div>
    </article>
  );
});