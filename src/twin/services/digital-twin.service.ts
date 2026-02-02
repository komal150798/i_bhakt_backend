import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
import { Customer } from '../../users/entities/customer.entity';
import { IKarmaRepository } from '../../core/interfaces/repositories/karma-repository.interface';
import { KarmaScoreService } from '../../karma/services/karma-score.service';
import { Manifestation } from '../../manifestation/entities/manifestation.entity';
import { JournalEntry } from '../../journal/entities/journal-entry.entity';
import { KarmaEntry } from '../../karma/entities/karma-entry.entity';

export interface AlignmentIndex {
  status: 'Fully Aligned' | 'Partially Aligned' | 'Misaligned';
  score: number; // 0-100
  components: {
    desire_clarity: 'Clear' | 'Unclear' | 'Mixed';
    karma_trend: 'Improving' | 'Declining' | 'Stable';
    current_time_support: 'Favorable' | 'Neutral' | 'Unfavorable';
  };
  focus_message: string;
  determination_note: string;
}

export interface ConsciousnessState {
  state: 'Stable' | 'Unstable' | 'Expanding' | 'Contracted';
  meaning: string;
  influence_factors: string[];
  action_suggestion: string;
}

export interface CurrentPhase {
  phase_label: string;
  direction: 'Favorable ↑' | 'Neutral →' | 'Unfavorable ↓';
  advisory_text: string;
  time_window_note: string;
}

export interface EmotionalBaseline {
  baseline: 'Calm' | 'Anxious' | 'Excited' | 'Neutral' | 'Stable';
  stability_indicator: number[]; // Array of values for graph
  insight_text: string;
  reflection_prompt: string;
}

export interface EnergyLevel {
  level: 'High' | 'Balanced' | 'Low' | 'Fluctuating';
  icon: string; // Lightning bolt, etc.
  suggested_approach: {
    act: string;
    reflect: string;
    rest: string;
  };
  influence_text: string;
  wisdom_prompt: string;
}

export interface KarmaState {
  state: 'Positive' | 'Negative' | 'Neutral';
  trend: 'Improving' | 'Declining' | 'Stable';
  icon: string; // Balance scale, etc.
  summary: {
    today: { good: number; bad: number; neutral: number };
    this_week: { good: number; bad: number; neutral: number };
    this_month: { good: number; bad: number; neutral: number };
  };
  recent_influence: string[];
  why_this_state: string;
  focus_message: string;
}

export interface ManifestationResonance {
  active_manifestation: {
    name: string;
    time_horizon: string;
  } | null;
  resonance_state: 'Supportive ↑' | 'Neutral →' | 'Challenging ↓';
  influence_summary: {
    karma: string;
    emotion: string;
    timing: string;
  };
  guidance_text: string;
}

export interface RecentActionInfluence {
  last_actions: Array<{
    action: string;
    status: 'Completed' | 'Pending' | 'Skipped';
    impact: 'High Impact' | 'Moderate Impact' | 'Low Impact';
  }>;
  impact_indicator: 'Strengthening ↑' | 'Stable →' | 'Weakening ↓';
  insight_text: string;
}

export interface ReflectionPrompt {
  question: string;
  type: 'daily' | 'weekly' | 'monthly';
}

export interface TwinEvolution {
  current_stage: 'Awakening' | 'Building' | 'Expanding' | 'Mastering';
  growth_indicators: {
    consistency: { value: number; label: string };
    awareness: { value: number; label: string };
    alignment: { value: number; label: string };
  };
  locked_states: string[];
}

@Injectable()
export class DigitalTwinService {
  private readonly logger = new Logger(DigitalTwinService.name);

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @Inject('IKarmaRepository')
    private readonly karmaRepository: IKarmaRepository,
    @InjectRepository(Manifestation)
    private readonly manifestationRepository: Repository<Manifestation>,
    @InjectRepository(JournalEntry)
    private readonly journalRepository: Repository<JournalEntry>,
    @InjectRepository(KarmaEntry)
    private readonly karmaEntryRepository: Repository<KarmaEntry>,
    private readonly karmaScoreService: KarmaScoreService,
  ) {}

  /**
   * Generate Digital Twin after profile completion
   */
  async generateDigitalTwin(userId: number): Promise<{ success: boolean; message: string; twin_id: string }> {
    const customer = await this.customerRepository.findOne({
      where: { id: userId, is_deleted: false },
    });

    if (!customer) {
      throw new NotFoundException('User not found');
    }

    // Mark twin as generated (could add a flag to customer entity)
    // For now, just return success
    return {
      success: true,
      message: "We've created a living reflection of your current alignment.",
      twin_id: customer.unique_id,
    };
  }

  /**
   * Get Alignment Index (Screen 01)
   */
  async getAlignmentIndex(userId: number): Promise<AlignmentIndex> {
    const karmaScore = await this.karmaScoreService.calculateUserKarmaScore(userId);
    
    // Get active manifestations
    const activeManifestations = await this.manifestationRepository.find({
      where: {
        user_id: userId,
        is_deleted: false,
        is_locked: true,
      },
      take: 1,
    });

    const hasClearDesire = activeManifestations.length > 0 && activeManifestations[0].coherence_score && activeManifestations[0].coherence_score > 70;
    const karmaTrend = karmaScore.trend;
    const timeSupport = karmaScore.trend_percentage > 5 ? 'Favorable' : karmaScore.trend_percentage < -5 ? 'Unfavorable' : 'Neutral';

    // Calculate alignment score
    let alignmentScore = karmaScore.karma_score;
    if (activeManifestations.length > 0 && activeManifestations[0].mfp_score) {
      alignmentScore = (alignmentScore + (activeManifestations[0].mfp_score * 100)) / 2;
    }

    let status: 'Fully Aligned' | 'Partially Aligned' | 'Misaligned';
    if (alignmentScore >= 75) {
      status = 'Fully Aligned';
    } else if (alignmentScore >= 50) {
      status = 'Partially Aligned';
    } else {
      status = 'Misaligned';
    }

    return {
      status,
      score: Math.round(alignmentScore),
      components: {
        desire_clarity: hasClearDesire ? 'Clear' : 'Unclear',
        karma_trend: karmaTrend === 'improving' ? 'Improving' : karmaTrend === 'declining' ? 'Declining' : 'Stable',
        current_time_support: timeSupport as 'Favorable' | 'Neutral' | 'Unfavorable',
      },
      focus_message: status === 'Fully Aligned' 
        ? 'Continue your focused intention with patience.'
        : status === 'Partially Aligned'
        ? 'Clarify your intentions and align your actions.'
        : 'Focus on improving your karma and clarifying your desires.',
      determination_note: 'It is a blend of your stated goals, current karma state, and cosmic timing.',
    };
  }

  /**
   * Get Consciousness State (Screen 02)
   */
  async getConsciousnessState(userId: number): Promise<ConsciousnessState> {
    const karmaScore = await this.karmaScoreService.calculateUserKarmaScore(userId);
    
    // Get recent journal entries
    const recentJournals = await this.journalRepository.find({
      where: {
        user_id: userId,
        is_deleted: false,
      },
      order: { entry_date: 'DESC' },
      take: 5,
    });

    const hasReflections = recentJournals.length > 0;
    const isStable = karmaScore.trend === 'stable' || karmaScore.trend === 'improving';

    let state: 'Stable' | 'Unstable' | 'Expanding' | 'Contracted';
    if (isStable && hasReflections) {
      state = 'Stable';
    } else if (karmaScore.trend === 'improving') {
      state = 'Expanding';
    } else if (karmaScore.trend === 'declining') {
      state = 'Contracted';
    } else {
      state = 'Unstable';
    }

    return {
      state,
      meaning: state === 'Stable'
        ? 'You are noticing your thoughts and emotions without getting swept away by them.'
        : state === 'Expanding'
        ? 'Your awareness is growing, and you are becoming more conscious of your patterns.'
        : state === 'Contracted'
        ? 'You may be experiencing resistance or limiting beliefs.'
        : 'Your consciousness is fluctuating. Focus on grounding practices.',
      influence_factors: [
        'Recent reflections',
        'Emotional patterns',
        'Awareness vs reaction',
      ],
      action_suggestion: state === 'Stable'
        ? 'Notice your thoughts without attachment.'
        : 'Practice mindfulness and self-observation.',
    };
  }

  /**
   * Get Current Phase (Screen 03)
   */
  async getCurrentPhase(userId: number): Promise<CurrentPhase> {
    const karmaScore = await this.karmaScoreService.calculateUserKarmaScore(userId);
    
    const isFavorable = karmaScore.trend === 'improving' && karmaScore.trend_percentage > 5;
    const direction = isFavorable ? 'Favorable ↑' : karmaScore.trend === 'declining' ? 'Unfavorable ↓' : 'Neutral →';

    return {
      phase_label: isFavorable ? 'Expansion Phase' : karmaScore.trend === 'declining' ? 'Contraction Phase' : 'Stable Phase',
      direction: direction as 'Favorable ↑' | 'Neutral →' | 'Unfavorable ↓',
      advisory_text: isFavorable
        ? 'This is a time for action and expansion. Seize the momentum now.'
        : karmaScore.trend === 'declining'
        ? 'This is a time for reflection and inner work. Focus on healing.'
        : 'This is a time for steady progress. Maintain your current practices.',
      time_window_note: isFavorable
        ? 'Short-term energy window is open. Seize the momentum now.'
        : 'Energy window is neutral. Focus on consistent actions.',
    };
  }

  /**
   * Get Emotional Baseline (Screen 04)
   */
  async getEmotionalBaseline(userId: number): Promise<EmotionalBaseline> {
    const recentJournals = await this.journalRepository.find({
      where: {
        user_id: userId,
        is_deleted: false,
      },
      order: { entry_date: 'DESC' },
      take: 7,
    });

    // Calculate average sentiment
    let totalSentiment = 0;
    let count = 0;
    recentJournals.forEach(journal => {
      if (journal.sentiment_analysis?.score) {
        totalSentiment += journal.sentiment_analysis.score;
        count++;
      }
    });

    const avgSentiment = count > 0 ? totalSentiment / count : 0.5;
    
    // Generate stability indicator (mock data for graph)
    const stabilityIndicator = Array.from({ length: 7 }, (_, i) => {
      const base = avgSentiment * 100;
      return Math.max(0, Math.min(100, base + (Math.random() * 20 - 10)));
    });

    let baseline: 'Calm' | 'Anxious' | 'Excited' | 'Neutral' | 'Stable';
    if (avgSentiment > 0.7) {
      baseline = 'Calm';
    } else if (avgSentiment > 0.5) {
      baseline = 'Stable';
    } else if (avgSentiment > 0.3) {
      baseline = 'Neutral';
    } else {
      baseline = 'Anxious';
    }

    return {
      baseline,
      stability_indicator: stabilityIndicator,
      insight_text: 'Your emotional baseline is the calm undercurrent of your being, regardless of surface fluctuations.',
      reflection_prompt: 'What brings you back to your calm center?',
    };
  }

  /**
   * Get Energy Level (Screen 05)
   */
  async getEnergyLevel(userId: number): Promise<EnergyLevel> {
    const karmaScore = await this.karmaScoreService.calculateUserKarmaScore(userId);
    
    // Calculate energy based on karma and recent activity
    const energy = this.calculateEnergyFromKarma(karmaScore);

    let level: 'High' | 'Balanced' | 'Low' | 'Fluctuating';
    if (energy >= 75) {
      level = 'High';
    } else if (energy >= 50) {
      level = 'Balanced';
    } else if (energy >= 30) {
      level = 'Fluctuating';
    } else {
      level = 'Low';
    }

    return {
      level,
      icon: '⚡',
      suggested_approach: {
        act: level === 'High' ? 'Focus on priorities' : level === 'Balanced' ? 'Maintain momentum' : 'Take small steps',
        reflect: level === 'High' ? 'Assess your path' : 'Review your progress',
        rest: level === 'Low' ? 'Recharge mindfully' : 'Maintain balance',
      },
      influence_text: 'Your energy is influenced by mental clarity, emotional state, and physical vitality.',
      wisdom_prompt: 'How can you use this energy wisely?',
    };
  }

  /**
   * Get Karma State (Screen 06)
   */
  async getKarmaState(userId: number): Promise<KarmaState> {
    const karmaScore = await this.karmaScoreService.calculateUserKarmaScore(userId);
    
    // Get karma entries for different time periods
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    
    const monthStart = new Date(now);
    monthStart.setDate(monthStart.getDate() - 30);
    monthStart.setHours(0, 0, 0, 0);

    const todayEntries = await this.karmaEntryRepository.find({
      where: {
        user_id: userId,
        is_deleted: false,
        entry_date: MoreThanOrEqual(todayStart),
      },
    });

    const weekEntries = await this.karmaEntryRepository.find({
      where: {
        user_id: userId,
        is_deleted: false,
        entry_date: MoreThanOrEqual(weekStart),
      },
    });

    const monthEntries = await this.karmaEntryRepository.find({
      where: {
        user_id: userId,
        is_deleted: false,
        entry_date: MoreThanOrEqual(monthStart),
      },
    });

    const countByType = (entries: KarmaEntry[]) => ({
      good: entries.filter(e => e.karma_type === 'good').length,
      bad: entries.filter(e => e.karma_type === 'bad').length,
      neutral: entries.filter(e => e.karma_type === 'neutral').length,
    });

    // Get recent influence sources
    const recentInfluence: string[] = [];
    if (todayEntries.length > 0) recentInfluence.push('Journaling');
    if (karmaScore.good_actions_count > karmaScore.bad_actions_count) recentInfluence.push('Actions');
    if (monthEntries.length > 10) recentInfluence.push('Rituals');

    return {
      state: karmaScore.karma_score >= 60 ? 'Positive' : karmaScore.karma_score < 40 ? 'Negative' : 'Neutral',
      trend: karmaScore.trend === 'improving' ? 'Improving' : karmaScore.trend === 'declining' ? 'Declining' : 'Stable',
      icon: '⚖️',
      summary: {
        today: countByType(todayEntries),
        this_week: countByType(weekEntries),
        this_month: countByType(monthEntries),
      },
      recent_influence: recentInfluence,
      why_this_state: 'Your actions have aligned with your intentions, creating positive momentum.',
      focus_message: 'Focus on mindful actions.',
    };
  }

  /**
   * Get Manifestation Resonance (Screen 07)
   */
  async getManifestationResonance(userId: number): Promise<ManifestationResonance> {
    const activeManifestation = await this.manifestationRepository.findOne({
      where: {
        user_id: userId,
        is_deleted: false,
        is_locked: true,
      },
      order: { added_date: 'DESC' },
    });

    const karmaScore = await this.karmaScoreService.calculateUserKarmaScore(userId);

    if (!activeManifestation) {
      return {
        active_manifestation: null,
        resonance_state: 'Neutral →',
        influence_summary: {
          karma: 'No active manifestation',
          emotion: 'Neutral',
          timing: 'Open',
        },
        guidance_text: 'Create a manifestation to see resonance analysis.',
      };
    }

    const resonanceScore = activeManifestation.resonance_score || 0;
    const resonanceState = resonanceScore > 70 ? 'Supportive ↑' : resonanceScore > 50 ? 'Neutral →' : 'Challenging ↓';

    return {
      active_manifestation: {
        name: activeManifestation.title,
        time_horizon: activeManifestation.target_date 
          ? `${Math.ceil((new Date(activeManifestation.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days`
          : 'Next 6 Months',
      },
      resonance_state: resonanceState as 'Supportive ↑' | 'Neutral →' | 'Challenging ↓',
      influence_summary: {
        karma: karmaScore.trend === 'improving' ? 'Positive Trend' : karmaScore.trend === 'declining' ? 'Negative Trend' : 'Stable',
        emotion: 'Stable Foundation',
        timing: 'Open Window',
      },
      guidance_text: 'Your current energy is well-aligned. Continue your focused intention with patience.',
    };
  }

  /**
   * Get Recent Action Influence (Screen 08)
   */
  async getRecentActionInfluence(userId: number): Promise<RecentActionInfluence> {
    const recentKarma = await this.karmaEntryRepository.find({
      where: {
        user_id: userId,
        is_deleted: false,
      },
      order: { entry_date: 'DESC' },
      take: 5,
    });

    const recentJournals = await this.journalRepository.find({
      where: {
        user_id: userId,
        is_deleted: false,
      },
      order: { entry_date: 'DESC' },
      take: 3,
    });

    const lastActions = [
      ...recentJournals.slice(0, 2).map(j => ({
        action: 'Morning Meditation',
        status: 'Completed' as const,
        impact: 'High Impact' as const,
      })),
      ...recentJournals.slice(0, 1).map(j => ({
        action: 'Evening Reflections',
        status: 'Completed' as const,
        impact: 'Moderate Impact' as const,
      })),
      ...recentKarma.slice(0, 1).map(k => ({
        action: 'Karma Actions',
        status: 'Completed' as const,
        impact: (Math.abs(Number(k.score)) > 5 ? 'High Impact' : 'Moderate Impact') as 'High Impact' | 'Moderate Impact',
      })),
      {
        action: 'Gratitude Journaling',
        status: 'Completed' as const,
        impact: 'Moderate Impact' as const,
      },
    ];

    const impactIndicator = recentKarma.length > 0 && recentKarma[0].karma_type === 'good' 
      ? 'Strengthening ↑' 
      : 'Stable →';

    return {
      last_actions: lastActions.slice(0, 4),
      impact_indicator: impactIndicator as 'Strengthening ↑' | 'Stable →' | 'Weakening ↓',
      insight_text: 'Your consistent positive actions are fortifying your digital twin\'s alignment with your intentions.',
    };
  }

  /**
   * Get Today's Reflection (Screen 09)
   */
  async getReflectionPrompt(userId: number): Promise<ReflectionPrompt> {
    const questions = [
      'What was my most aligned action today?',
      'How did I show up authentically today?',
      'What am I grateful for today?',
      'What did I learn about myself today?',
      'How did I contribute positively today?',
    ];

    // Rotate questions based on day of week
    const dayOfWeek = new Date().getDay();
    const question = questions[dayOfWeek % questions.length];

    return {
      question,
      type: 'daily',
    };
  }

  /**
   * Get Twin Evolution (Screen 10)
   */
  async getTwinEvolution(userId: number): Promise<TwinEvolution> {
    const karmaScore = await this.karmaScoreService.calculateUserKarmaScore(userId);
    
    // Calculate consistency (based on recent activity)
    const recentKarma = await this.karmaEntryRepository.count({
      where: {
        user_id: userId,
        is_deleted: false,
        entry_date: MoreThanOrEqual(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
      },
    });

    const consistency = Math.min(100, (recentKarma / 30) * 100);
    const awareness = karmaScore.karma_score;
    const alignment = await this.getAlignmentIndex(userId).then(a => a.score);

    let currentStage: 'Awakening' | 'Building' | 'Expanding' | 'Mastering';
    const avgScore = (consistency + awareness + alignment) / 3;
    if (avgScore >= 80) {
      currentStage = 'Mastering';
    } else if (avgScore >= 60) {
      currentStage = 'Expanding';
    } else if (avgScore >= 40) {
      currentStage = 'Building';
    } else {
      currentStage = 'Awakening';
    }

    return {
      current_stage: currentStage,
      growth_indicators: {
        consistency: {
          value: Math.round(consistency),
          label: consistency >= 70 ? 'Strong' : consistency >= 50 ? 'Moderate' : 'Developing',
        },
        awareness: {
          value: Math.round(awareness),
          label: awareness >= 70 ? 'Expanding' : awareness >= 50 ? 'Growing' : 'Developing',
        },
        alignment: {
          value: Math.round(alignment),
          label: alignment >= 70 ? 'Improving' : alignment >= 50 ? 'Stable' : 'Developing',
        },
      },
      locked_states: currentStage === 'Awakening' 
        ? ['Building', 'Expanding', 'Mastering']
        : currentStage === 'Building'
        ? ['Expanding', 'Mastering']
        : currentStage === 'Expanding'
        ? ['Mastering']
        : [],
    };
  }

  /**
   * Get Complete Digital Twin Summary
   */
  async getCompleteTwinSummary(userId: number): Promise<{
    alignment_index: AlignmentIndex;
    consciousness_state: ConsciousnessState;
    current_phase: CurrentPhase;
    emotional_baseline: EmotionalBaseline;
    energy_level: EnergyLevel;
    karma_state: KarmaState;
    manifestation_resonance: ManifestationResonance;
    recent_actions: RecentActionInfluence;
    reflection: ReflectionPrompt;
    evolution: TwinEvolution;
  }> {
    const [
      alignmentIndex,
      consciousnessState,
      currentPhase,
      emotionalBaseline,
      energyLevel,
      karmaState,
      manifestationResonance,
      recentActions,
      reflection,
      evolution,
    ] = await Promise.all([
      this.getAlignmentIndex(userId),
      this.getConsciousnessState(userId),
      this.getCurrentPhase(userId),
      this.getEmotionalBaseline(userId),
      this.getEnergyLevel(userId),
      this.getKarmaState(userId),
      this.getManifestationResonance(userId),
      this.getRecentActionInfluence(userId),
      this.getReflectionPrompt(userId),
      this.getTwinEvolution(userId),
    ]);

    return {
      alignment_index: alignmentIndex,
      consciousness_state: consciousnessState,
      current_phase: currentPhase,
      emotional_baseline: emotionalBaseline,
      energy_level: energyLevel,
      karma_state: karmaState,
      manifestation_resonance: manifestationResonance,
      recent_actions: recentActions,
      reflection,
      evolution,
    };
  }

  /**
   * Helper: Calculate energy from karma score
   */
  private calculateEnergyFromKarma(karmaScore: any): number {
    let energy = karmaScore.karma_score;
    
    if (karmaScore.trend === 'improving') {
      energy += Math.min(10, karmaScore.trend_percentage * 0.1);
    } else if (karmaScore.trend === 'declining') {
      energy += Math.max(-10, karmaScore.trend_percentage * 0.1);
    }

    return Math.max(0, Math.min(100, energy));
  }
}

