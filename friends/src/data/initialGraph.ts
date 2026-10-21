/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FriendEdge, FriendNode, GraphDataset } from '../types/graph';

export const INITIAL_NODES: FriendNode[] = [
  // Community 1: Streamers & Night Discord Crew
  {
    id: 'zubarefff',
    name: 'Александр Зубарев',
    handle: '@zubarefff',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
    interests: ['IRL Стримы', 'Мемы', 'Юмор', 'Пельмени', 'Ночной Discord'],
    bio: 'Душа компании, главный по ночным историям и пельменям.',
    customClusterId: 'c1',
  },
  {
    id: 'bratishkinoff',
    name: 'Владимир Братишкин',
    handle: '@bratishkinoff',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=256&q=80',
    interests: ['Стримы', 'CS2', 'Мемы', 'Подкасты', 'Мерч'],
    bio: 'Лидер 89-го сквада, всегда на связи в войсе.',
    customClusterId: 'c1',
  },
  {
    id: 'dmitry_lixxx',
    name: 'Дмитрий Ликс',
    handle: '@dmitry_lixxx',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    interests: ['Казино', 'IRL', 'Юмор', 'Ночной Discord', 'Музыка'],
    bio: 'Ночные эфиры, байки из жизни и душевное общение.',
    customClusterId: 'c1',
  },
  {
    id: 'sasavot',
    name: 'Саша Sasavot',
    handle: '@sasavot',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    interests: ['CS2', 'IRL', 'Юмор', 'Twitch'],
    bio: 'Любит совместные катки и постоянный движ.',
    customClusterId: 'c1',
  },
  {
    id: 'korya_mc',
    name: 'Коря',
    handle: '@korya_mc',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
    interests: ['Рэп', 'Музыка', 'Ночной Discord', 'Фристайл'],
    bio: 'Музыкальный критик в конфе и создатель битов.',
    customClusterId: 'c1',
  },

  // Community 2: CS2 & Cyber Esports Squad
  {
    id: 'shadowkekw',
    name: 'Макс Шадоукек',
    handle: '@shadowkekw',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=80',
    interests: ['CS2', 'Фейсит', 'Качалка', 'Шутеры', 'Мемы'],
    bio: 'Капитан кибер-стака, тащит клатчи 1 в 4.',
    customClusterId: 'c2',
  },
  {
    id: 'strogo',
    name: 'Иван Строго',
    handle: '@strogo',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80',
    interests: ['CS2', 'AIMP', 'Faceit 10 lvl', 'Турниры'],
    bio: 'Жесткий аимер, 3000 эло на фейсите.',
    customClusterId: 'c2',
  },
  {
    id: 'metashi12',
    name: 'Меташи',
    handle: '@metashi12',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
    interests: ['CS2', 'Киберспорт', 'Стримы', 'Мемы'],
    bio: 'Саппорт стака, кидает идеальные смоки.',
    customClusterId: 'c2',
  },
  {
    id: 'aunkere',
    name: 'Женя Аункер',
    handle: '@aunkere',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80',
    interests: ['CS2', 'Про-сцена', 'Турниры', 'Качалка', 'Мерч'],
    bio: 'Бывший про-игрок, разбирает демки и учит играть.',
    customClusterId: 'c2',
  },

  // Community 3: Global / Western Gaming Hub (Sodapoppin / Zackrawrr / Poki)
  {
    id: 'zackrawrr',
    name: 'Asmongold / Zack',
    handle: '@zackrawrr',
    avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=256&q=80',
    interests: ['MMO', 'World of Warcraft', 'Реакции', 'Новости игр', 'Дискуссии'],
    bio: 'Легенда WoW, мастер длинных философских монологов.',
    customClusterId: 'c3',
  },
  {
    id: 'sodapoppin',
    name: 'Thomas Chance',
    handle: '@sodapoppin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    interests: ['Инди-игры', 'WoW', 'Кооп', 'Мемы', 'Настолки'],
    bio: 'Играет во всё подряд, собирает вечеринки в коопе.',
    customClusterId: 'c3',
  },
  {
    id: 'pikabooirl',
    name: 'Pikaboo',
    handle: '@pikabooirl',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
    interests: ['WoW Arena', 'PvP', 'Рога', 'Кооп', 'Юмор'],
    bio: 'Бессменный рога, позитивный настрой 24/7.',
    customClusterId: 'c3',
  },
  {
    id: 'xaryu',
    name: 'Xaryu',
    handle: '@xaryu',
    avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=256&q=80',
    interests: ['WoW', 'Фитнес', 'ЗОЖ', 'Маг', 'Мотивация'],
    bio: 'Фитнес-гуру и легендарный маг арены.',
    customClusterId: 'c3',
  },

  // Community 4: Tech, Code & Indie Devs
  {
    id: 'tech_denis',
    name: 'Денис Технарь',
    handle: '@denis_tech',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80',
    interests: ['React', 'TypeScript', 'Web3', 'Стартапы', 'Гаджеты'],
    bio: 'Архитектор кода, пишет ботов для нашего дискорда.',
    customClusterId: 'c4',
  },
  {
    id: 'alisa_designer',
    name: 'Алиса Дизайн',
    handle: '@alisa_ui',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
    interests: ['UI/UX', 'Figma', '3D графика', 'Аниме', 'Мерч'],
    bio: 'Рисует аватарки, стикерпаки и оформление комьюнити.',
    customClusterId: 'c4',
  },
  {
    id: 'mark_backend',
    name: 'Марк Серверный',
    handle: '@mark_dev',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    interests: ['Go', 'Docker', 'Linux', 'CS2', 'Кибербезопасность'],
    bio: 'Админит игровые сервера и поднимает ноды.',
    customClusterId: 'c4',
  },

  // Bridge Connectors: Key figures holding groups together!
  {
    id: 'ravshann',
    name: 'Равшан',
    handle: '@ravshann',
    avatarUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=256&q=80',
    interests: ['Музыка', 'CS2', 'IRL Стримы', 'Мемы', 'Ночной Discord'],
    bio: 'Связующий мост между дискорд-братвой и кибер-стаком!',
  },
  {
    id: 'hasanabi',
    name: 'Hasan Piker',
    handle: '@hasanabi',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    interests: ['Политика', 'Игры', 'Коллабы', 'Подкасты', 'Мемы'],
    bio: 'Мост между русскоязычным и англоязычным стрим-сообществом.',
  },
  {
    id: 'stariy_bog',
    name: 'Старый Бог',
    handle: '@stariy_bog',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=256&q=80',
    interests: ['Dota 2', 'Мемы', 'Юмор', 'Турниры', 'Кастомки'],
    bio: 'Мастер доты, объединяет любителей доты и CS2 в один войс.',
  },
];

export const INITIAL_EDGES: FriendEdge[] = [
  // Community 1 internal connections (Stream & Night Discord)
  { id: 'e1', source: 'zubarefff', target: 'bratishkinoff', strength: 5, relationshipType: 'Братский вайб и совместные стримы', mutualChatsPerWeek: 14 },
  { id: 'e2', source: 'zubarefff', target: 'dmitry_lixxx', strength: 4, relationshipType: 'Ночные созвоны в дискорде', mutualChatsPerWeek: 8 },
  { id: 'e3', source: 'zubarefff', target: 'sasavot', strength: 4, relationshipType: 'Постоянные катки и угар', mutualChatsPerWeek: 6 },
  { id: 'e4', source: 'zubarefff', target: 'korya_mc', strength: 3, relationshipType: 'Слушают треки вместе', mutualChatsPerWeek: 4 },
  { id: 'e5', source: 'bratishkinoff', target: 'dmitry_lixxx', strength: 5, relationshipType: 'Лучшие друзья, 89 сквад', mutualChatsPerWeek: 20 },
  { id: 'e6', source: 'bratishkinoff', target: 'sasavot', strength: 4, relationshipType: 'Общий войс-чат каждый день', mutualChatsPerWeek: 10 },
  { id: 'e7', source: 'dmitry_lixxx', target: 'sasavot', strength: 4, relationshipType: 'Вечерние игры и стримы', mutualChatsPerWeek: 7 },
  { id: 'e8', source: 'dmitry_lixxx', target: 'korya_mc', strength: 3, relationshipType: 'Музыкальные посиделки', mutualChatsPerWeek: 5 },

  // Community 2 internal connections (CS2 Cyber Squad)
  { id: 'e9', source: 'shadowkekw', target: 'strogo', strength: 5, relationshipType: 'Постоянный дуэт на Faceit', mutualChatsPerWeek: 18 },
  { id: 'e10', source: 'shadowkekw', target: 'metashi12', strength: 4, relationshipType: 'Клатч-мастера в одном стаке', mutualChatsPerWeek: 12 },
  { id: 'e11', source: 'shadowkekw', target: 'aunkere', strength: 4, relationshipType: 'Турнирные праки и тренировки', mutualChatsPerWeek: 9 },
  { id: 'e12', source: 'strogo', target: 'metashi12', strength: 5, relationshipType: 'Старые тиммейты по CS', mutualChatsPerWeek: 15 },
  { id: 'e13', source: 'strogo', target: 'aunkere', strength: 4, relationshipType: 'Катают вместе турниры', mutualChatsPerWeek: 11 },
  { id: 'e14', source: 'metashi12', target: 'aunkere', strength: 3, relationshipType: 'Обсуждают мету и смоки', mutualChatsPerWeek: 6 },

  // Community 3 internal connections (Global Gaming Hub)
  { id: 'e15', source: 'zackrawrr', target: 'sodapoppin', strength: 5, relationshipType: 'Друзья более 10 лет, гильдия WoW', mutualChatsPerWeek: 14 },
  { id: 'e16', source: 'zackrawrr', target: 'pikabooirl', strength: 4, relationshipType: 'Арена гладиаторы', mutualChatsPerWeek: 8 },
  { id: 'e17', source: 'zackrawrr', target: 'xaryu', strength: 4, relationshipType: 'Обсуждение фитнеса и патчей', mutualChatsPerWeek: 6 },
  { id: 'e18', source: 'sodapoppin', target: 'pikabooirl', strength: 5, relationshipType: 'Кооп угар и комедийные стримы', mutualChatsPerWeek: 16 },
  { id: 'e19', source: 'pikabooirl', target: 'xaryu', strength: 5, relationshipType: 'Непобедимый дуэт Рога + Маг', mutualChatsPerWeek: 12 },

  // Community 4 internal connections (Tech & Devs)
  { id: 'e20', source: 'tech_denis', target: 'alisa_designer', strength: 5, relationshipType: 'Пилим стартап и ботов вместе', mutualChatsPerWeek: 15 },
  { id: 'e21', source: 'tech_denis', target: 'mark_backend', strength: 5, relationshipType: 'Фуллстек дуэт, кодят ночами', mutualChatsPerWeek: 14 },
  { id: 'e22', source: 'alisa_designer', target: 'mark_backend', strength: 4, relationshipType: 'Дизайн систем и архитектура', mutualChatsPerWeek: 8 },

  // CRITICAL BRIDGE CONNECTIONS ("Связующие звенья"!)
  // 1. Ravshann bridges Group 1 (Discord/Stream) and Group 2 (CS2 Squad):
  { id: 'b1', source: 'ravshann', target: 'zubarefff', strength: 4, relationshipType: 'Чиллят в войсе и смеются с мемов', mutualChatsPerWeek: 9 },
  { id: 'b2', source: 'ravshann', target: 'bratishkinoff', strength: 4, relationshipType: 'Общие тусовки и ивенты', mutualChatsPerWeek: 7 },
  { id: 'b3', source: 'ravshann', target: 'shadowkekw', strength: 5, relationshipType: 'Любимый тиммейт в CS2', mutualChatsPerWeek: 12 },
  { id: 'b4', source: 'ravshann', target: 'strogo', strength: 4, relationshipType: 'Катают ночной Faceit', mutualChatsPerWeek: 8 },

  // 2. Zubareff has cross-squad bridges:
  { id: 'b5', source: 'zubarefff', target: 'shadowkekw', strength: 4, relationshipType: 'Ночные зарубы на стриме', mutualChatsPerWeek: 6 },
  { id: 'b6', source: 'sasavot', target: 'shadowkekw', strength: 3, relationshipType: 'Периодический общий стак', mutualChatsPerWeek: 5 },

  // 3. Hasanabi bridges Russian-speaking streamer squad and English-speaking gaming hub:
  { id: 'b7', source: 'hasanabi', target: 'bratishkinoff', strength: 3, relationshipType: 'Смотрели стримы друг друга', mutualChatsPerWeek: 4 },
  { id: 'b8', source: 'hasanabi', target: 'zubarefff', strength: 3, relationshipType: 'Реакции и общие темы', mutualChatsPerWeek: 3 },
  { id: 'b9', source: 'hasanabi', target: 'sodapoppin', strength: 4, relationshipType: 'Коллаборации и подкасты', mutualChatsPerWeek: 8 },
  { id: 'b10', source: 'hasanabi', target: 'zackrawrr', strength: 4, relationshipType: 'Игровые дебаты и новости', mutualChatsPerWeek: 7 },

  // 4. Stariy Bog bridges CS2 and Streamers with Dota & humor:
  { id: 'b11', source: 'stariy_bog', target: 'shadowkekw', strength: 4, relationshipType: 'Кастомки в доте и троллинг в CS', mutualChatsPerWeek: 10 },
  { id: 'b12', source: 'stariy_bog', target: 'dmitry_lixxx', strength: 4, relationshipType: 'Казино и стримы', mutualChatsPerWeek: 9 },
  { id: 'b13', source: 'stariy_bog', target: 'bratishkinoff', strength: 3, relationshipType: 'Общий чат стримеров', mutualChatsPerWeek: 5 },

  // 5. Tech gang bridges into Gaming & Discord:
  { id: 'b14', source: 'tech_denis', target: 'bratishkinoff', strength: 3, relationshipType: 'Помогает настраивать бота и сервер', mutualChatsPerWeek: 4 },
  { id: 'b15', source: 'mark_backend', target: 'shadowkekw', strength: 4, relationshipType: 'Настроил тренировочный CS2 сервер', mutualChatsPerWeek: 6 },
  { id: 'b16', source: 'alisa_designer', target: 'zubarefff', strength: 3, relationshipType: 'Сделала стикеры и оформление', mutualChatsPerWeek: 5 },
];

export const INITIAL_DATASET: GraphDataset = {
  nodes: INITIAL_NODES,
  edges: INITIAL_EDGES,
  customClusterNames: {
    c1: 'Discord & Streamers',
    c2: 'CS2 & Cyber Squad',
    c3: 'Global Gaming Hub',
    c4: 'Tech & Code Gang',
  },
  adminCredentials: {
    secretUsername: 'admin',
    secretPasscode: 'secretfriends',
  },
};
