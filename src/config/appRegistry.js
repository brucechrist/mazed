import React from 'react';
import QuestJournal from '../QuestJournal.jsx';
import NofapCalendar from '../NofapCalendar.jsx';
import VersionRating from '../VersionRating.jsx';
import WhoAmI from '../WhoAmI.jsx';
import MusicSearch from '../MusicSearch.jsx';
import Singing from '../Singing.jsx';
import ShadowWork from '../ShadowWork.jsx';
import Calendar from '../Calendar.jsx';
import Timeline from '../Timeline.jsx';
import Typomancy from '../Typomancy.jsx';
import Moodtracker from '../Moodtracker.jsx';
import MomentoMori from '../MomentoMori.jsx';
import QuadrantCombinaisons from '../QuadrantCombinaisons.jsx';
import Anima from '../Anima.jsx';
import ToolsBlog from '../ToolsBlog.jsx';
import TodoGoals from '../TodoGoals.jsx';
import ActivityApp from '../ActivityApp.jsx';
import CharacterEvolve from '../CharacterEvolve.jsx';
import SemiFormlessCharacter from '../SemiFormlessCharacter.jsx';
import FormlessCharacter from '../FormlessCharacter.jsx';
import IdeaBoard from '../IdeaBoard.jsx';
import ImplementationIdeas from '../ImplementationIdeas.jsx';
import Orb from '../Orb.jsx';
import Watchdog from '../Watchdog.jsx';
import AkashicRecords from '../AkashicRecords.jsx';

const DEFAULT_LAYER = 'Form';

const withBackHandler = (Component) => ({ onClose }) => (
  <Component onBack={onClose} />
);

const makeIcon = (className, content = null) => () => (
  <div className={className}>{content}</div>
);

const emojiIcon = (emoji) => makeIcon('star-icon', emoji);

export const toolApps = [
  {
    id: 'journal',
    title: 'Quest Journal',
    icon: makeIcon('journal-icon', '📓'),
    defaultLayer: DEFAULT_LAYER,
    render: withBackHandler(QuestJournal),
  },
  {
    id: 'nofap',
    title: 'NoFap Calendar',
    icon: makeIcon('calendar-preview'),
    defaultLayer: DEFAULT_LAYER,
    render: withBackHandler(NofapCalendar),
  },
  {
    id: 'ratings',
    title: 'Version Ratings',
    icon: emojiIcon('⭐⭐⭐⭐⭐'),
    defaultLayer: DEFAULT_LAYER,
    render: withBackHandler(VersionRating),
  },
  {
    id: 'whoami',
    title: 'Who Am I?',
    icon: makeIcon('question-icon', '❓'),
    defaultLayer: DEFAULT_LAYER,
    render: withBackHandler(WhoAmI),
  },
  {
    id: 'music',
    title: 'Music Search',
    icon: emojiIcon('🎵'),
    defaultLayer: DEFAULT_LAYER,
    render: withBackHandler(MusicSearch),
  },
  {
    id: 'singing',
    title: 'Singing',
    icon: emojiIcon('🎤'),
    defaultLayer: DEFAULT_LAYER,
    render: withBackHandler(Singing),
  },
  {
    id: 'shadow',
    title: 'Shadow Work',
    icon: emojiIcon('🌑'),
    defaultLayer: DEFAULT_LAYER,
    render: withBackHandler(ShadowWork),
  },
  {
    id: 'calendar',
    title: 'Calendar',
    icon: emojiIcon('🗓️'),
    defaultLayer: DEFAULT_LAYER,
    render: withBackHandler(Calendar),
  },
  {
    id: 'timeline',
    title: 'Timeline',
    icon: emojiIcon('📆'),
    defaultLayer: DEFAULT_LAYER,
    render: withBackHandler(Timeline),
  },
  {
    id: 'typomancy',
    title: 'Typomancy',
    icon: emojiIcon('⌨️'),
    defaultLayer: DEFAULT_LAYER,
    render: withBackHandler(Typomancy),
  },
  {
    id: 'moodtracker',
    title: 'Moodtracker',
    icon: emojiIcon('😊'),
    defaultLayer: DEFAULT_LAYER,
    render: withBackHandler(Moodtracker),
  },
  {
    id: 'momentoMori',
    title: 'Momento Mori',
    icon: emojiIcon('☠️'),
    defaultLayer: DEFAULT_LAYER,
    render: withBackHandler(MomentoMori),
  },
  {
    id: 'quadrantComb',
    title: 'Quadrant combinaisons',
    icon: emojiIcon('🔀'),
    defaultLayer: DEFAULT_LAYER,
    render: withBackHandler(QuadrantCombinaisons),
  },
  {
    id: 'anima',
    title: 'Anima',
    icon: emojiIcon('💃'),
    defaultLayer: DEFAULT_LAYER,
    render: withBackHandler(Anima),
  },
  {
    id: 'blog',
    title: 'Tools Blog',
    icon: emojiIcon('📰'),
    defaultLayer: DEFAULT_LAYER,
    render: withBackHandler(ToolsBlog),
  },
  {
    id: 'todoGoals',
    title: 'Todo & Goals',
    icon: emojiIcon('✅'),
    defaultLayer: DEFAULT_LAYER,
    render: withBackHandler(TodoGoals),
  },
  {
    id: 'activity',
    title: 'Activity',
    icon: emojiIcon('🏃'),
    defaultLayer: DEFAULT_LAYER,
    render: withBackHandler(ActivityApp),
  },
  {
    id: 'characterEvolve',
    title: 'Character Evolve',
    icon: emojiIcon('🌱'),
    defaultLayer: DEFAULT_LAYER,
    render: withBackHandler(CharacterEvolve),
  },
  {
    id: 'semiCharacter',
    title: 'Semi Character',
    icon: emojiIcon('🔮'),
    defaultLayer: DEFAULT_LAYER,
    render: withBackHandler(SemiFormlessCharacter),
  },
  {
    id: 'ideaBoard',
    title: 'Idea Board',
    icon: emojiIcon('📝'),
    defaultLayer: DEFAULT_LAYER,
    render: withBackHandler(IdeaBoard),
  },
  {
    id: 'implementationIdeas',
    title: 'Implementation Ideas',
    icon: emojiIcon('📑'),
    defaultLayer: DEFAULT_LAYER,
    render: withBackHandler(ImplementationIdeas),
  },
  {
    id: 'orb',
    title: 'Orb',
    icon: emojiIcon('🧿'),
    defaultLayer: DEFAULT_LAYER,
    render: withBackHandler(Orb),
  },
  {
    id: 'watchdog',
    title: 'Watchdog',
    icon: emojiIcon('🐶'),
    defaultLayer: DEFAULT_LAYER,
    render: withBackHandler(Watchdog),
  },
];

export const pinnedToolApps = [
  {
    id: 'blogInline',
    title: 'Blog',
    layer: 'Form',
    icon: emojiIcon('📝'),
    render: withBackHandler(ToolsBlog),
    hideWhenActive: true,
  },
];

export const auxiliaryApps = [
  {
    id: 'akashicRecords',
    title: 'Akashic Records',
    render: withBackHandler(AkashicRecords),
  },
  {
    id: 'formlessCharacter',
    title: 'Formless Character',
    render: withBackHandler(FormlessCharacter),
  },
];

const registryEntries = [
  ...toolApps,
  ...pinnedToolApps,
  ...auxiliaryApps,
];

const registry = new Map(registryEntries.map((app) => [app.id, app]));

export function getAppDefinition(id) {
  return registry.get(id) ?? null;
}

export function getToolAppDefinition(id) {
  return toolApps.find((app) => app.id === id) ?? null;
}

export function isPinnedToolApp(id) {
  return pinnedToolApps.some((app) => app.id === id);
}

export function createDefaultAppLayers() {
  const defaults = {};
  toolApps.forEach((app) => {
    defaults[app.id] = app.defaultLayer ?? DEFAULT_LAYER;
  });
  return defaults;
}

export function isDockableApp(id) {
  const app = getToolAppDefinition(id);
  return app ? app.supportsDock !== false : false;
}
