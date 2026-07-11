import SupportGroup from '../models/SupportGroup.js';
import Resource from '../models/Resource.js';
import Meditation from '../models/Meditation.js';
import DailyMotivation from '../models/DailyMotivation.js';
import Quote from '../models/Quote.js';
import MeditationCategory from '../models/MeditationCategory.js';
import MeditationArticle from '../models/MeditationArticle.js';
import MeditationVideo from '../models/MeditationVideo.js';
import UserMeditationProgress from '../models/UserMeditationProgress.js';
import WatchHistory from '../models/WatchHistory.js';
import ReadingProgress from '../models/ReadingProgress.js';
import { SEED_QUOTES } from '../controllers/quoteController.js';
import mongoose from 'mongoose';

export const seedInitialData = async (forceReset = false) => {
  try {
    if (forceReset) {
      console.log('🧹 Force resetting user progress tracking collections...');
      // Clear user progress tracking collections to reset statistics to zero
      await UserMeditationProgress.deleteMany({});
      await WatchHistory.deleteMany({});
      await ReadingProgress.deleteMany({});
    }

    // 1. Seed Support Groups
    const groupCount = await SupportGroup.countDocuments();
    if (groupCount === 0) {
      console.log('🌱 Seeding initial Support Groups...');
      await SupportGroup.create([
        {
          name: 'Students Support',
          description: 'Peer discussions, student stress, exam tips, and university life coping circles.',
          members: [],
        },
        {
          name: 'Working Professionals',
          description: 'Workplace stress management, career tips, professional burnout recovery circles.',
          members: [],
        },
        {
          name: 'Parents Circle',
          description: 'Parenting stress, general family concerns, and parenting mental wellness discussions.',
          members: [],
        },
        {
          name: 'Teenagers safe-space',
          description: 'Adolescent growth, peer pressure, identity, and academic coping guidelines.',
          members: [],
        },
        {
          name: 'Anxiety Support',
          description: 'A safe space to discuss panic triggers, social anxiety, and daily breathing habits.',
          members: [],
        },
        {
          name: 'Stress Management',
          description: 'Reframing cognitive stress, progressive muscle relaxation, and daily tips.',
          members: [],
        },
      ]);
      console.log('✅ Support Groups seeded successfully!');
    }

    // Always re-seed resources if they lack rich fields (like fullContent) to ensure high fidelity
    const sampleResource = await Resource.findOne({ type: 'article' });
    if (!sampleResource || !sampleResource.fullContent) {
      console.log('🌱 Clearing and seeding high-fidelity Resource Library...');
      await Resource.deleteMany({});
      
      const seededResources = await Resource.create([
        {
          title: 'Modern Stress Management Techniques',
          description: 'A guide on how to identify work-related stress triggers and implement cognitive reframing methods.',
          type: 'article',
          category: 'Stress Relief',
          url: '/library/modern-stress-management',
          duration: '6 mins read',
          author: 'Dr. Sarah Jenkins, PhD',
          publishedDate: new Date('2026-05-10'),
          tags: ['stress', 'cbt', 'burnout'],
          coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
          fullContent: `### Identifying Your Stress Triggers
          
Stress is a natural physiological reaction to demanding situations. When your brain senses a threat, it releases a surge of hormones including adrenaline and cortisol. While this "fight-or-flight" response is helpful in emergencies, chronic activation leads to physical and emotional exhaustion.

To manage stress effectively, you must first identify your primary stress triggers. Keep a daily journal of moments when you feel tense, anxious, or overwhelmed. Note the time, environment, and your thoughts immediately preceding the stress.

### Cognitive Reframing Techniques

Once you identify a trigger, apply cognitive reframing. This is a Core CBT (Cognitive Behavioral Therapy) strategy that involves challenging automated negative thoughts:
1. **Identify the Thought**: "I will never finish this project on time, and it will ruin my career."
2. **Examine the Evidence**: Have you missed critical deadlines in the past? What is the worst that can realistically happen?
3. **Reframe the Narrative**: "This is a challenging deadline, but I can break it down into smaller steps and communicate with my manager if I need support."

### The Power of Micro-Breaks

Taking scheduled 5-minute micro-breaks every hour can reset your autonomic nervous system. Step away from screens, perform light stretching, or practice simple box breathing (inhale for 4 seconds, hold for 4 seconds, exhale for 4 seconds, hold empty for 4 seconds). Over time, these breaks lower baseline stress hormones and sustain cognitive performance.`
        },
        {
          title: 'The Art of Meditation: For Beginners',
          description: 'Step-by-step introduction to Vipassana and concentration-based meditation models.',
          type: 'article',
          category: 'Meditation',
          url: '/library/art-of-meditation',
          duration: '5 mins read',
          author: 'Yogi Ananda Kumar',
          publishedDate: new Date('2026-05-12'),
          tags: ['meditation', 'mindfulness', 'zen'],
          coverImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=800',
          fullContent: `### What is Meditation?

Meditation is not about turning off your thoughts or cleaning your mind. Instead, it is the practice of training your attention and awareness to gain a healthy perspective. You are learning to observe your thoughts and feelings without judgment, helping you understand them better.

### Finding Your Meditation Style

There are two primary styles of meditation suited for beginners:
1. **Concentration Meditation**: Focusing on a single point. This is typically the breath. Every time your mind wanders (which it will), gently bring your focus back to the sensation of air entering and leaving your nostrils.
2. **Mindfulness Meditation**: Observing your thoughts as they pass. Instead of getting caught up in a worry or memory, you acknowledge the thought ("worrying about tomorrow") and let it drift away like a cloud.

### Establishing a Consistent Routine

Consistency is far more important than duration. Start with just 3 to 5 minutes every morning. Sit comfortably, keep your back straight, close your eyes, and focus on the present moment. Using a timer or guided meditation session can help build the initial habit.`
        },
        {
          title: 'Improving Sleep Hygiene & Deep Rest',
          description: 'Science-backed sleep protocols, including light management and wind-down routines.',
          type: 'article',
          category: 'Sleep',
          url: '/library/sleep-hygiene',
          duration: '7 mins read',
          author: 'Dr. Michael Breus, Sleep Specialist',
          publishedDate: new Date('2026-05-14'),
          tags: ['sleep', 'circadian', 'recovery'],
          coverImage: 'https://images.unsplash.com/photo-1511295742364-9279435338e7?w=800',
          fullContent: `### Understanding Your Circadian Rhythm

Your body relies on an internal clock, known as the circadian rhythm, to regulate sleepiness and alertness. This rhythm is heavily influenced by light exposure. Viewing natural sunlight within 30 minutes of waking helps set your clock, boosting morning focus and paving the way for melatonin release later in the evening.

### Designing a Wind-Down Routine

A successful transition to sleep requires a buffer zone. Allocate the last 45 to 60 minutes of your evening to wind down:
- **Dim the Lights**: Reduce ambient overhead lights to signal to your brain that night has arrived.
- **Disconnect from Screens**: Blue light from phones, tablets, and TVs suppresses melatonin production. Put devices away or use strict night-shift filters.
- **Relaxing Activities**: Read a physical book, practice progressive muscle relaxation, or listen to a soothing sleep meditation.

### Optimizing Your Sleep Environment

Keep your bedroom cool (around 65°F or 18°C), dark, and quiet. Reserve your bed strictly for sleep and intimacy to reinforce a strong mental association between the bed and rest. If you cannot fall asleep after 20 minutes, get out of bed and do a quiet, low-light activity until you feel tired.`
        },
        {
          title: 'Cognitive Reframing for Anxiety Control',
          description: 'Identify automatic negative schemas and de-catastrophize anxious predictions.',
          type: 'article',
          category: 'Anxiety',
          url: '/library/cognitive-reframing',
          duration: '8 mins read',
          author: 'Dr. Evelyn Carter, Clinical Psychologist',
          publishedDate: new Date('2026-05-18'),
          tags: ['anxiety', 'cbt', 'mental-health'],
          coverImage: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800',
          fullContent: `### The Mechanics of Anxiety

Anxiety is an emotional state characterized by feelings of tension, worried thoughts, and physical changes like increased blood pressure. It is often fueled by cognitive distortions—irrational thought patterns that convince us of negative outcomes. Common distortions include catastrophizing (expecting the worst-case scenario) and mind-reading (assuming others are thinking negatively of us).

### Practical CBT Reframing Exercises

To break free from anxious loops, practice these steps when worries arise:
1. **Catch the Distortion**: Notice when you are projecting a disaster. Write down the automatic thought.
2. **Challenge the Assumption**: Ask yourself, "Is this thought 100% true? What objective evidence supports it? What evidence contradicts it?"
3. **Decatastrophize**: Ask yourself, "If the worst happened, how would I cope? Who could I reach out to for support?"

### Grounding Yourself in the Present

When physical anxiety or panic strikes, direct your focus to your body. Perform the **5-4-3-2-1 Grounding Method**: Name 5 things you can see, 4 things you can touch, 3 things you hear, 2 things you smell, and 1 thing you taste. This shifts your nervous system away from the fight-or-flight panic cycle and anchors you back to safety.`
        },
        {
          title: 'Sustainable Productivity Without Burnout',
          description: 'How to use time-blocking and emotional checkpoints to maintain healthy work boundaries.',
          type: 'article',
          category: 'Focus',
          url: '/library/sustainable-productivity',
          duration: '6 mins read',
          author: 'Marcus Aurelius, Productivity Consultant',
          publishedDate: new Date('2026-05-20'),
          tags: ['productivity', 'focus', 'burnout'],
          coverImage: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?w=800',
          fullContent: `### The Myth of Constant Grind

In today's fast-paced environment, productivity is often mistakenly equated with constant activity. However, pushing your brain to work continuously without restorative breaks leads to cognitive fatigue, errors, and eventual burnout. Sustainable productivity recognizes that focus operates in cycles.

### Time-Blocking and the Pomodoro Method

Organize your day using structured focus blocks:
- **The Pomodoro Technique**: Work with intense, undivided focus for 25 minutes, then take a 5-minute restorative break. After four cycles, take a longer 20-minute break.
- **Deep Work Blocks**: Dedicate 90-minute morning blocks to your highest priority, cognitively demanding tasks, shielding yourself from email and chat notifications.

### Setting Boundaries

Learn to establish healthy work boundaries. Define a clear "shutdown time" each evening, and turn off work notifications. This lets your mind completely disengage, facilitating genuine recovery and ensuring you return with fresh cognitive resources the next morning.`
        },
        {
          title: 'Recovering from Burnout & Fatigue',
          description: 'Clinical stages of occupational burnout and active recovery plans.',
          type: 'article',
          category: 'Self Love',
          url: '/library/recovering-from-burnout',
          duration: '8 mins read',
          author: 'Dr. Rebecca Hall, MD',
          publishedDate: new Date('2026-05-22'),
          tags: ['burnout', 'fatigue', 'recovery'],
          coverImage: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800',
          fullContent: `### Understanding the Burnout Cycle

Occupational burnout is a state of physical, emotional, and mental exhaustion caused by excessive and prolonged stress. It is characterized by feelings of cynicism, detachment, and a lack of accomplishment. Burnout doesn't happen overnight; it develops gradually over months of overworking and ignoring health checkpoints.

### Action Plan for Recovery

Recovering from chronic burnout requires intentional lifestyle adjustments:
1. **Prioritize Physiological Rest**: Focus on securing consistent, age-appropriate sleep (7-9 hours for adults) and staying hydrated.
2. **Perform a Boundary Audit**: Identify tasks and commitments you can delegate, postpone, or decline.
3. **Restore Joy**: Dedicate time to activities that have no productivity goal, such as walking in nature, hobbies, or spending quality time with loved ones.

### Self-Compassion in Healing

Be gentle with yourself. Healing from fatigue takes time, and your cognitive capacity may feel temporarily reduced. Treat yourself with the same kindness and patience you would offer a close friend recovering from a physical illness.`
        },
        // YouTube Videos
        {
          title: 'Guided Box Breathing Cycle',
          description: 'A 4-4-4-4 visual guide to instantly lower autonomic nervous system arousal.',
          type: 'video',
          category: 'Anxiety',
          url: 'https://www.youtube.com/embed/F28MGLlpP90',
          duration: '4 mins video',
          channel: 'Mindfulness Association',
          views: '124K views',
          thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500'
        },
        {
          title: '10-Minute Guided Mindfulness Meditation',
          description: 'A simple breathing awareness practice to anchor attention to the present moment.',
          type: 'video',
          category: 'Morning',
          url: 'https://www.youtube.com/embed/O-6f5wQXSu8',
          duration: '10 mins video',
          channel: 'MindCare TV',
          views: '450K views',
          thumbnail: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=500'
        },
        {
          title: 'Deep Relaxation PMR Visual Guide',
          description: 'Progressive muscle relaxation video to relieve body tension and muscle stiffness.',
          type: 'video',
          category: 'Stress Relief',
          url: 'https://www.youtube.com/embed/1nZHNyObV70',
          duration: '8 mins video',
          channel: 'Relaxation Hub',
          views: '89K views',
          thumbnail: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?w=500'
        },
        {
          title: 'White Noise Sleep Wave',
          description: 'Deep ambient white noise to shield external noises and calm thoughts before sleep.',
          type: 'video',
          category: 'Sleep',
          url: 'https://www.youtube.com/embed/w6T02g5hnT4',
          duration: '12 mins video',
          channel: 'Sleep Science Clinic',
          views: '3.4M views',
          thumbnail: 'https://images.unsplash.com/photo-1511295742364-9279435338e7?w=500'
        }
      ]);
      
      console.log('✅ Resource Library seeded successfully!');
    }

    // 3. Seed Motivations Quotes
    const quotesCount = await DailyMotivation.countDocuments();
    if (quotesCount === 0) {
      console.log('🌱 Seeding motivational quotes...');
      await DailyMotivation.create([
        {
          quote: "You don't have to control your thoughts. You just have to stop letting them control you.",
          author: "Dan Millman",
          active: true
        },
        {
          quote: "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.",
          author: "Thich Nhat Hanh",
          active: true
        },
        {
          quote: "Quiet the mind and the soul will speak.",
          author: "Ma Jaya Sati Bhagavati",
          active: true
        },
        {
          quote: "The present moment is filled with joy and happiness. If you are attentive, you will see it.",
          author: "Thich Nhat Hanh",
          active: true
        }
      ]);
      console.log('✅ Motivational quotes seeded successfully!');
    }

    // Seed new Quotes collection
    const quoteCount = await Quote.countDocuments();
    if (quoteCount === 0) {
      console.log('🌱 Seeding new high-quality Quotes...');
      await Quote.create(SEED_QUOTES);
      console.log('✅ New Quotes seeded successfully!');
    }

    // Always re-seed meditations if they lack correct categories to ensure high fidelity
    const sampleMeditation = await Meditation.findOne({ category: 'Morning' });
    if (!sampleMeditation) {
      console.log('🌱 Clearing and seeding initial meditation sessions with exact categories...');
      await Meditation.deleteMany({});
      
      const adminId = new mongoose.Types.ObjectId("65f01234567890abcdef1234");
      await Meditation.create([
        {
          title: "Calm the Racing Mind",
          description: "A relaxing guided meditation to reduce stress and find inner peace.",
          category: "Stress Relief",
          difficulty: "Beginner",
          duration: 900,
          thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500",
          videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-meditating-by-the-sea-at-sunrise-41586-large.mp4",
          featured: true,
          createdBy: adminId
        },
        {
          title: "Morning Mindfulness Focus",
          description: "Energize your day with simple breathing awareness guidelines.",
          category: "Morning",
          difficulty: "Beginner",
          duration: 600,
          thumbnail: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=500",
          videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-meditating-by-the-sea-at-sunrise-41586-large.mp4",
          featured: false,
          createdBy: adminId
        },
        {
          title: "Letting Go of Chronic Stress",
          description: "Relax body tightness, scan tension patterns, and ease thoughts.",
          category: "Stress Relief",
          difficulty: "Intermediate",
          duration: 900,
          thumbnail: "https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?w=500",
          videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-meditating-by-the-sea-at-sunrise-41586-large.mp4",
          featured: false,
          createdBy: adminId
        },
        {
          title: "Breath & Grounding Anchor",
          description: "Tactile box breathing routines to lower acute anxiety levels.",
          category: "Anxiety",
          difficulty: "Beginner",
          duration: 480,
          thumbnail: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=500",
          videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-meditating-by-the-sea-at-sunrise-41586-large.mp4",
          featured: false,
          createdBy: adminId
        },
        {
          title: "Deep Sleep Melodies",
          description: "Let go of active thoughts and drift off to deep restorative sleep.",
          category: "Sleep",
          difficulty: "Beginner",
          duration: 1200,
          thumbnail: "https://images.unsplash.com/photo-1511295742364-9279435338e7?w=500",
          videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-meditating-by-the-sea-at-sunrise-41586-large.mp4",
          featured: false,
          createdBy: adminId
        },
        {
          title: "Self Compassion & Love",
          description: "Nurture self-compassion, affirm resilience, and boost self confidence.",
          category: "Self Love",
          difficulty: "Intermediate",
          duration: 720,
          thumbnail: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=500",
          videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-meditating-by-the-sea-at-sunrise-41586-large.mp4",
          featured: false,
          createdBy: adminId
        },
        {
          title: "Focused Attention Training",
          description: "Develop sharp mental clarity and cognitive focus.",
          category: "Focus",
          difficulty: "Advanced",
          duration: 480,
          thumbnail: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=500",
          videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-meditating-by-the-sea-at-sunrise-41586-large.mp4",
          featured: false,
          createdBy: adminId
        }
      ]);
      console.log('✅ Meditation sessions seeded successfully!');
    }

    // --- SEED MEDITATION CATEGORIES ---
    const categoryCount = await MeditationCategory.countDocuments();
    if (categoryCount === 0 || forceReset) {
      console.log('🌱 Seeding Meditation Categories...');
      await MeditationCategory.deleteMany({});
      const categories = await MeditationCategory.create([
        { name: 'Stress Relief', slug: 'stress-relief', description: 'Calm your nervous system and find emotional stability through guided breathing and deep mindfulness patterns.', icon: 'Smile', count: '12 Sessions' },
        { name: 'Sleep', slug: 'sleep', description: 'Prepare your mind and body for deep, restorative sleep by letting go of daytime cognitive stress.', icon: 'Moon', count: '10 Sessions' },
        { name: 'Anxiety', slug: 'anxiety', description: 'Ground yourself during acute moments of worry, panic, or overwhelming cognitive scatter.', icon: 'Heart', count: '8 Sessions' },
        { name: 'Focus', slug: 'focus', description: 'Train your attention muscle to resist distractions and sustain cognitive concentration.', icon: 'Target', count: '9 Sessions' },
        { name: 'Self Love', slug: 'self-love', description: 'Nurture self-compassion, silence self-criticism, and celebrate your personal resilience.', icon: 'Award', count: '7 Sessions' },
        { name: 'Morning', slug: 'morning', description: 'Awaken your attention and set positive, focused intentions for your upcoming workday.', icon: 'Sun', count: '6 Sessions' }
      ]);
      console.log('✅ Meditation Categories seeded successfully!');
    }

    // --- SEED MEDITATION ARTICLES ---
    const articleCount = await MeditationArticle.countDocuments();
    if (articleCount === 0 || forceReset) {
      console.log('🌱 Seeding Meditation Articles (30+)...');
      await MeditationArticle.deleteMany({});

    const expandArticleContent = (categorySlug, title, summary, shortContent) => {
      const formattedCategory = (categorySlug || 'wellness').replace('-', ' ').toUpperCase();
      
      let deepDive = '';
      if (categorySlug === 'stress-relief') {
        deepDive = `### Understanding Sympathetic Dominance
Prolonged activation of the sympathetic nervous system leads to chronic high blood pressure, sleep disturbances, and elevated arterial plaque. 

### The Cortisol Loop & Cognitive Decline
Cortisol is beneficial in short bursts, but prolonged exposure physically damages the hippocampus, making it difficult to consolidate memory and make sound judgments.

### Therapeutic Reset Protocols
• **Progression-Based Relaxation**: Tense your shoulders for 5 seconds while inhaling, then release completely with a sigh. Repeat down to your feet.
• **Diaphragmatic Breathing**: Place one hand on your chest and the other on your stomach. Breathe so that only the hand on your stomach moves.`;
      } else if (categorySlug === 'sleep') {
        deepDive = `### Neurobiology of Sleep Architecture
Deep sleep represents slow-wave delta sleep where human growth hormone is secreted to rebuild micro-tears in muscle and clear metabolic waste from brain cells.

### The Adenosine Build-up
Adenosine builds up in the brain during waking hours, creating "sleep pressure". Caffeine blocks adenosine receptors, preventing the brain from recognizing sleepiness.

### Insomnia Rescue Protocol
• **The 20-Minute Rule**: If you cannot sleep after 20 minutes, get out of bed. Read under dim light until tired. Never associate your bed with wakefulness.
• **Temperature Drops**: Lower the bedroom temperature to 65°F (18°C) to simulate the body's natural nocturnal cooling cycle.`;
      } else if (categorySlug === 'anxiety') {
        deepDive = `### Somatosensory Feedback & Worry Loops
Anxiety is not just mental; it is a full body loop. Muscle tension and rapid shallow breathing signal the amygdala that danger is present, worsening worry.

### Breaking the Cycle with Vagus Nerve Activation
The vagus nerve controls the parasympathetic response. Extending your exhale longer than your inhale instantly triggers vagal cooling, slowing the heart rate.

### Acute Panic Interventions
• **The 5-4-3-2-1 Grounding Method**: Name 5 things you see, 4 you can feel, 3 you hear, 2 you smell, and 1 you taste. This shifts brain activity back to sensory cortexes.
• **Physiological Sighing**: Take two quick inhales through the nose, followed by one long, slow exhale through the mouth. Repeat 3 times to restore CO2 balance.`;
      } else if (categorySlug === 'focus') {
        deepDive = `### Attention Residue & Task Switching
Switching tasks leaves "attention residue." Part of your focus remains stuck on the prior task, degrading your cognitive performance on the current one.

### Dopamine Auditing
Constant notifications hijack dopamine reward loops, shortening your attention span. Restoring your baseline focus requires periods of silent deep work.

### High-Focus Execution Protocols
• **The Pomodoro Interval**: Work for 25 minutes with single-minded focus, then take a 5-minute break. After 4 cycles, take a 30-minute break.
• **The Attention Anchor**: If your mind wanders, label the distraction ("thinking", "worrying") and return focus to your breath.`;
      } else if (categorySlug === 'self-love') {
        deepDive = `### The Neurochemistry of Self-Criticism
Self-criticism activates the amygdala, triggering a threat-response that floods your body with adrenaline. Self-compassion activates the caregiving system, releasing oxytocin.

### Quieting the Inner Critic
Cognitive behavioral techniques involve recognizing critical self-talk and rewriting it with factual, supportive statements.

### Self-Appreciation Rituals
• **Compassionate Letter Writing**: Write a letter to yourself from the perspective of a loving friend who accepts all your struggles.
• **Daily Worthiness Affirmations**: Verbally recognize three things you appreciate about your character before sleeping.`;
      } else {
        // Morning
        deepDive = `### Cortisol Awakening Response (CAR)
Your body naturally spikes cortisol levels in the morning to help you wake up. Aligning your wake-up time with natural daylight supports healthy CAR cycles.

### Immediate Sunlight Exposure
Getting 10 minutes of direct sunlight in the morning stops melatonin production, anchors your circadian rhythm, and guarantees better sleep tonight.

### Core Morning Intentions
• **Postpone the Screen**: Wait at least 30 minutes before opening emails or social media to protect your early cognitive clarity.
• **Mindful Hydration**: Drink a glass of water before caffeine to restore hydration lost overnight.`;
      }

      return `${shortContent}

${deepDive}

### Recommended Implementation Framework

1. **Structured Scheduling**: Dedicate 5 to 10 minutes daily at the same time to build stable habit loops.
2. **Space Design**: Practice in a quiet zone free from notification sounds and work clutter.
3. **Reflective Logging**: Document physical and emotional shifts before and after practice to track progress.

Explore the rest of the wellness tools and interactive dashboards in the ${formattedCategory} section to continue building your custom resilience program.`;
    };

    const rawArticles = [
      // Stress Relief
      {
        categorySlug: 'stress-relief',
        title: 'Understanding Stress',
        author: 'Dr. Sarah Jenkins',
        readingTime: '5 min read',
        summary: 'Learn about the biological foundations of stress and how to manage it in today’s environment.',
        content: 'Stress is a natural physical and mental reaction to life experiences. Everyone expresses stress from time to time. Anything from everyday responsibilities like work and family to serious life events such as a new diagnosis, war, or the death of a loved one can trigger stress. For immediate, short-term situations, stress can be beneficial to your health. It can help you cope with potentially serious situations. Your body responds to stress by releasing hormones that increase your heart and breathing rates and ready your muscles to respond.\n\nHowever, when stress levels stay high for longer than is necessary, it can take a toll on your health. Chronic stress can cause a variety of symptoms and affect your overall well-being. Practicing mindfulness helps retrain your brain to react to stressful situations calmly, minimizing cortisol rushes.',
        coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500',
        heroImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1000'
      },
      {
        categorySlug: 'stress-relief',
        title: 'What Chronic Stress Does To Your Brain',
        author: 'Prof. Alan Carter',
        readingTime: '7 min read',
        summary: 'Explore how prolonged stress alters brain structure, memory pathways, and emotional centers.',
        content: 'Chronic stress can actually shrink the prefrontal cortex—the area of the brain responsible for memory and learning. While stress can cause memory loss or difficulty concentrating, it also triggers the enlargement of the amygdala, which can make the brain more receptive to future stress. This creates a feedback loop where stress makes you more vulnerable to stress. Over time, high levels of cortisol damage cells in the hippocampus, reducing your ability to form new memories and control emotional triggers. Practicing meditation serves as a biological reset, lowering cortisol and building gray matter back in the prefrontal cortex.',
        coverImage: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?w=500',
        heroImage: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?w=1000'
      },
      {
        categorySlug: 'stress-relief',
        title: '5 Minute Relaxation Techniques',
        author: 'Emma Walsh',
        readingTime: '4 min read',
        summary: 'Quick, clinically-validated methods to reset your nervous system in five minutes or less.',
        content: 'When stress strikes in the middle of a busy workday, you don’t always have time for a full hour of meditation. That’s where short-form resets come in. Box breathing (inhaling for 4 seconds, holding for 4, exhaling for 4, and holding for 4) is used by Navy SEALs to stay calm under intense pressure. Progressive Muscle Relaxation (PMR)—where you tense and release muscle groups from your toes to your face—takes under 5 minutes and immediately relieves physical strain. Keep these techniques in your back pocket for quick resets during stressful moments.',
        coverImage: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=500',
        heroImage: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1000'
      },
      {
        categorySlug: 'stress-relief',
        title: 'Science Behind Meditation',
        author: 'Dr. Michael Chen',
        readingTime: '6 min read',
        summary: 'A look into how meditation physically rewires neural networks through neuroplasticity.',
        content: 'Neuroscientists have observed that regular meditation increases the thickness of the hippocampus, which is critical for memory and learning, while decreasing cell volume in the amygdala, which controls fear, anxiety, and stress response. These changes occur through neuroplasticity—the brain’s ability to reshape itself based on repeated behavior. By intentionally practicing mindfulness, you are literally sculpting your brain to become more resilient to emotional upheavals and workplace burnout.',
        coverImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=500',
        heroImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=1000'
      },
      {
        categorySlug: 'stress-relief',
        title: 'Breathing Exercises Explained',
        author: 'Diana Rose',
        readingTime: '5 min read',
        summary: 'Discover different breathing patterns and how they trigger autonomic nervous system calm.',
        content: 'Breathing is the only autonomic bodily function that you can consciously control. By altering your breathing pattern, you can manually override your sympathetic nervous system (fight-or-flight) and activate the parasympathetic nervous system (rest-and-digest). Techniques like the 4-7-8 method, alternate nostril breathing, and diaphragmatic breathing have been shown to immediately lower heart rate, reduce stress hormones, and return focus to the present moment.',
        coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500',
        heroImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1000'
      },

      // Sleep
      {
        categorySlug: 'sleep',
        title: 'Sleep Hygiene',
        author: 'Dr. Julian Vance',
        readingTime: '5 min read',
        summary: 'Tips to optimize your sleeping environment and habits for deep restoration.',
        content: 'Sleep hygiene refers to the habits and environment that support high-quality sleep. Essential guidelines include keeping a consistent schedule, optimizing bedroom temperature (around 65°F or 18°C), avoiding screens for 45 minutes before bedtime, and reducing caffeine intake after lunch. Consistently following these steps signals to your body that it is safe to enter deep, restorative sleep cycles.',
        coverImage: 'https://images.unsplash.com/photo-1520206183501-b80af970d440?w=500',
        heroImage: 'https://images.unsplash.com/photo-1520206183501-b80af970d440?w=1000'
      },
      {
        categorySlug: 'sleep',
        title: 'Circadian Rhythm',
        author: 'Prof. Lily Carter',
        readingTime: '6 min read',
        summary: 'Understand your biological clock and how light exposure regulates sleep patterns.',
        content: 'Your circadian rhythm is the internal 24-hour clock that regulates cycles of alertness and sleepiness by responding to light changes. Morning sunlight triggers cortisol release, promoting focus. Sunset signals to the brain to produce melatonin, promoting sleep. Artificial blue light from phone screens disrupts this process, delaying sleep onset. Aligning your routine with natural light cycles is key to optimal wellness.',
        coverImage: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=500',
        heroImage: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=1000'
      },
      {
        categorySlug: 'sleep',
        title: 'REM Sleep',
        author: 'Dr. Noah Brooks',
        readingTime: '4 min read',
        summary: 'Discover the stage of sleep where dreaming happens and emotional memories are processed.',
        content: 'Rapid Eye Movement (REM) sleep is the stage of sleep responsible for cognitive restoration, dreaming, and consolidating emotional memories. During REM sleep, the brain is highly active, resembling an awake state, while the body is temporarily paralyzed. Ensuring enough uninterrupted sleep time is essential for the brain to transition through all critical REM stages, improving daytime focus.',
        coverImage: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=500',
        heroImage: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1000'
      },
      {
        categorySlug: 'sleep',
        title: 'Deep Sleep',
        author: 'Dr. Rebecca Foster',
        readingTime: '5 min read',
        summary: 'Learn about slow-wave sleep and how your body physically recovers and heals.',
        content: 'Deep sleep, or slow-wave sleep, is the stage where the body undergoes physical repair, tissue growth, and immune system rejuvenation. Growth hormones are released, and metabolic waste is cleared from the brain. Practicing deep breathing before bed helps prolong the duration of deep sleep stages, accelerating recovery from stress.',
        coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500',
        heroImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1000'
      },
      {
        categorySlug: 'sleep',
        title: 'Meditation For Better Sleep',
        author: 'Diana Rose',
        readingTime: '6 min read',
        summary: 'How mindfulness reduces night-time cognitive chatter and helps you fall asleep faster.',
        content: 'Falling asleep requires letting go of active control and cognitive chatter. Sleep meditation redirects your attention to somatic anchors—like the breath or a body scan—allowing the nervous system to relax. This decreases night-time heart rate and shifts the brain into alpha and theta wave states, paving the way for seamless sleep onset.',
        coverImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=500',
        heroImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=1000'
      },

      // Anxiety
      {
        categorySlug: 'anxiety',
        title: 'Understanding Anxiety',
        author: 'Dr. Sarah Jenkins',
        readingTime: '5 min read',
        summary: 'The survival roots of anxiety and how to recognize its psychological signs.',
        content: 'Anxiety is an evolutionary alarm system designed to protect us from physical threats. In modern life, this system is often triggered by psychological stressors—like work deadlines or social dynamics. Recognizing the physical sensations (tight chest, shallow breath) as a protective response helps defuse its emotional control.',
        coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500',
        heroImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1000'
      },
      {
        categorySlug: 'anxiety',
        title: 'Grounding Techniques',
        author: 'Emma Walsh',
        readingTime: '4 min read',
        summary: 'Easy exercises like the 5-4-3-2-1 method to pull yourself back to the present moment.',
        content: 'During acute anxiety, your focus splits into future-oriented worry loops. Grounding techniques pull you back to current physical reality. The 5-4-3-2-1 method involves identifying 5 things you see, 4 you feel, 3 you hear, 2 you smell, and 1 you taste, immediately grounding the nervous system.',
        coverImage: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=500',
        heroImage: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1000'
      },
      {
        categorySlug: 'anxiety',
        title: 'Managing Overthinking',
        author: 'Prof. Alan Carter',
        readingTime: '6 min read',
        summary: 'How to stop cognitive rumination loops and establish mental boundaries.',
        content: 'Overthinking is a response to perceived uncertainty. Practicing CBT thought mapping—where you write down a worry, identify cognitive distortions, and draft realistic reframes—is highly effective. Setting a 15-minute "worry window" also keeps rumination from spreading across your entire day.',
        coverImage: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?w=500',
        heroImage: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?w=1000'
      },
      {
        categorySlug: 'anxiety',
        title: 'Panic Attack Guide',
        author: 'Dr. Michael Chen',
        readingTime: '5 min read',
        summary: 'A physiological breakdown of panic attacks and actionable ways to navigate them safely.',
        content: 'A panic attack is a temporary adrenaline rush. It cannot harm you, even though it feels overwhelming. Slowing your exhalation to be longer than your inhalation activates parasympathetic feedback. Focus on letting your body release adrenaline while repeating, "I am safe, and this will pass."',
        coverImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=500',
        heroImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=1000'
      },
      {
        categorySlug: 'anxiety',
        title: 'Box Breathing',
        author: 'Diana Rose',
        readingTime: '4 min read',
        summary: 'Step-by-step instructions for tactical box breathing to regulate physical panic.',
        content: 'Box breathing (equal parts inhale, hold, exhale, hold) is a direct physiological reset. It coordinates heart rate variability and signals safety to the amygdala. Regular practice establishes a strong baseline of stress resilience.',
        coverImage: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=500',
        heroImage: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=1000'
      },

      // Focus
      {
        categorySlug: 'focus',
        title: 'Deep Work',
        author: 'Prof. Alan Carter',
        readingTime: '6 min read',
        summary: 'How to structure high-concentration focus blocks and reduce cognitive residue.',
        content: 'Deep work is the ability to focus without distraction on a cognitively demanding task. Eliminating notifications and setting clear focus blocks prevents cognitive residue—the mental distraction caused by switching tasks.',
        coverImage: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?w=500',
        heroImage: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?w=1000'
      },
      {
        categorySlug: 'focus',
        title: 'Improve Concentration',
        author: 'Dr. Michael Chen',
        readingTime: '5 min read',
        summary: 'Practical attention exercises to strengthen your daily mental execution.',
        content: 'Attention is a muscle that can be trained. Doing single-point concentration exercises (like focusing on a candle flame or breath sensations) builds cognitive stamina, helping you sustain focus for longer.',
        coverImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=500',
        heroImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=1000'
      },
      {
        categorySlug: 'focus',
        title: 'Attention Training',
        author: 'Emma Walsh',
        readingTime: '5 min read',
        summary: 'A look into cognitive control exercises and how they reduce distraction rates.',
        content: 'Attention Training Therapy (ATT) helps train the brain to selectively focus, divide, and shift attention. This reduces rumination and helps you ignore irrelevant sensory distractions in open workspaces.',
        coverImage: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=500',
        heroImage: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1000'
      },
      {
        categorySlug: 'focus',
        title: 'Meditation For Productivity',
        author: 'Diana Rose',
        readingTime: '5 min read',
        summary: 'How mindfulness resets cognitive fatigue and enhances creative problem solving.',
        content: 'Mindfulness resets cognitive fatigue. Short breathing breaks restore cognitive energy, allowing for fresh insights and sustained execution throughout the workday.',
        coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500',
        heroImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1000'
      },
      {
        categorySlug: 'focus',
        title: 'Digital Detox',
        author: 'Dr. Sarah Jenkins',
        readingTime: '6 min read',
        summary: 'Establish structural boundaries around screen time to protect cognitive energy.',
        content: 'Constant notifications deplete dopamine reserves. Setting device-free windows lets your brain recover, restoring baseline focus and reducing daily fatigue.',
        coverImage: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=500',
        heroImage: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=1000'
      },

      // Self Love
      {
        categorySlug: 'self-love',
        title: 'Self Compassion',
        author: 'Emma Walsh',
        readingTime: '5 min read',
        summary: 'Nurture kind self-talk during challenges instead of strict self-criticism.',
        content: 'Self-compassion means treating yourself with the same kindness you would offer a close friend. Acknowledging that setbacks are part of the shared human experience helps you recover faster from stress.',
        coverImage: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=500',
        heroImage: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1000'
      },
      {
        categorySlug: 'self-love',
        title: 'Positive Self Talk',
        author: 'Diana Rose',
        readingTime: '4 min read',
        summary: 'Identify negative patterns and reframe them with self-compassionate language.',
        content: 'Your inner dialogue shapes your emotional baseline. Identifying self-critical thoughts and reframing them with supportive language shifts your mindset to one of growth and resilience.',
        coverImage: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=500',
        heroImage: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=1000'
      },
      {
        categorySlug: 'self-love',
        title: 'Building Confidence',
        author: 'Dr. Sarah Jenkins',
        readingTime: '5 min read',
        summary: 'Establish healthy personal boundaries to build trust in your own value.',
        content: 'Confidence grows when you act in alignment with your values and respect your own boundaries. Saying no when necessary and honoring your needs builds self-trust and confidence.',
        coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500',
        heroImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1000'
      },
      {
        categorySlug: 'self-love',
        title: 'Healing Practices',
        author: 'Dr. Michael Chen',
        readingTime: '6 min read',
        summary: 'Techniques like journaling to heal from past stress and emotional wounds.',
        content: 'Healing is an active process of processing emotions. Reflective journaling helps you release pent-up stress and understand behavior patterns, promoting self-awareness.',
        coverImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=500',
        heroImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=1000'
      },
      {
        categorySlug: 'self-love',
        title: 'Emotional Acceptance',
        author: 'Prof. Alan Carter',
        readingTime: '5 min read',
        summary: 'Allow emotions to flow without judgment to reduce psychological stress.',
        content: 'Resisting emotions amplifies stress. Allowing yourself to feel and accept emotions without judgment lets them pass naturally, promoting emotional balance.',
        coverImage: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?w=500',
        heroImage: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?w=1000'
      },

      // Morning
      {
        categorySlug: 'morning',
        title: 'Morning Gratitude',
        author: 'Diana Rose',
        readingTime: '4 min read',
        summary: 'How reflecting on three grateful things sets a positive tone for your day.',
        content: 'Reflecting on gratitude in the morning primes your brain for positive experiences, reducing stress levels and promoting a productive mindset for the day ahead.',
        coverImage: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=500',
        heroImage: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=1000'
      },
      {
        categorySlug: 'morning',
        title: 'Morning Routine',
        author: 'Dr. Sarah Jenkins',
        readingTime: '5 min read',
        summary: 'Habits like light stretching and deep breathing to wake up with calm energy.',
        content: 'A thoughtful morning routine builds transition space. Simple habits like light stretching and breathing exercises wake up the body, promoting calm and focus.',
        coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500',
        heroImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1000'
      },
      {
        categorySlug: 'morning',
        title: 'Morning Energy',
        author: 'Dr. Michael Chen',
        readingTime: '5 min read',
        summary: 'How early hydration and morning light exposure optimize your sleep cycle.',
        content: 'Morning light and early hydration stop melatonin production and start cortisol release, boosting your energy levels and supporting high-quality sleep at night.',
        coverImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=500',
        heroImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=1000'
      },
      {
        categorySlug: 'morning',
        title: 'Healthy Habits',
        author: 'Emma Walsh',
        readingTime: '6 min read',
        summary: 'Small morning choices that support sustained focus throughout the day.',
        content: 'Your first morning choices shape your focus. Postponing notifications and starting with a mindful task helps you maintain control over your day.',
        coverImage: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=500',
        heroImage: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1000'
      },
      {
        categorySlug: 'morning',
        title: 'Morning Meditation',
        author: 'Prof. Alan Carter',
        readingTime: '5 min read',
        summary: 'A short morning breathing reset to set clear intentions and find focus.',
        content: 'Morning meditation sets a mindful tone. Even a short 5-minute breathing exercise reduces morning grogginess and sharpens concentration for your tasks.',
        coverImage: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?w=500',
        heroImage: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?w=1000'
      }
    ];

    const expandedArticles = rawArticles.map(art => ({
      ...art,
      content: expandArticleContent(art.categorySlug, art.title, art.summary, art.content)
    }));

    await MeditationArticle.create(expandedArticles);
    console.log('✅ Meditation Articles seeded successfully!');
    }

    // --- SEED MEDITATION VIDEOS ---
    const videoCount = await MeditationVideo.countDocuments();
    if (videoCount === 0 || forceReset) {
      console.log('🌱 Seeding Meditation Videos (30+)...');
      await MeditationVideo.deleteMany({});
    await MeditationVideo.create([
      // Stress Relief
      {
        _id: new mongoose.Types.ObjectId('668edd27364b4bb8bcd40001'),
        categorySlug: 'stress-relief',
        title: '10-Minute Guided Meditation for Stress Relief',
        channel: 'Goodful',
        duration: '10:00',
        views: '4.2M views',
        publishedDate: '2 years ago',
        description: 'Take ten minutes for yourself to breathe, let go of daily tension, and restore your calm.',
        youtubeUrl: 'https://www.youtube.com/watch?v=z6X5oEIg6Ak',
        thumbnail: 'https://img.youtube.com/vi/z6X5oEIg6Ak/hqdefault.jpg'
      },
      {
        categorySlug: 'stress-relief',
        title: '15-Minute Yoga for Stress and Anxiety Relief',
        channel: 'Yoga With Adriene',
        duration: '15:00',
        views: '8.1M views',
        publishedDate: '3 years ago',
        description: 'A gentle stretching and guided breathing yoga practice to help you let go of daily pressure.',
        youtubeUrl: 'https://www.youtube.com/watch?v=bJJWArRfKa0',
        thumbnail: 'https://img.youtube.com/vi/bJJWArRfKa0/hqdefault.jpg'
      },
      {
        categorySlug: 'stress-relief',
        title: '10-Minute Meditation for Stress & Tension Release',
        channel: 'Declutter The Mind',
        duration: '10:00',
        views: '1.2M views',
        publishedDate: '1 year ago',
        description: 'Quiet your active thoughts and relax your body with this comforting breath scanning session.',
        youtubeUrl: 'https://www.youtube.com/watch?v=ZToicYcHIOU',
        thumbnail: 'https://img.youtube.com/vi/ZToicYcHIOU/hqdefault.jpg'
      },
      {
        categorySlug: 'stress-relief',
        title: '10 Minute Meditation to Release Stress',
        channel: 'Great Meditation',
        duration: '10:00',
        views: '2.5M views',
        publishedDate: '11 months ago',
        description: 'Breathe and let go of stress with this quick, grounding 10-minute mindfulness reset.',
        youtubeUrl: 'https://www.youtube.com/watch?v=O-6f5wQXSu8',
        thumbnail: 'https://img.youtube.com/vi/O-6f5wQXSu8/hqdefault.jpg'
      },
      {
        categorySlug: 'stress-relief',
        title: 'Hypnosis for Detachment From Over-Thinking',
        channel: 'Michael Sealey',
        duration: '35:20',
        views: '30M views',
        publishedDate: '4 years ago',
        description: 'A deep hypnosis session designed to completely clear stress, worry loops, and calm your thoughts.',
        youtubeUrl: 'https://www.youtube.com/watch?v=jbw8VSkWxxs',
        thumbnail: 'https://img.youtube.com/vi/jbw8VSkWxxs/hqdefault.jpg'
      },

      // Sleep
      {
        categorySlug: 'sleep',
        title: 'Guided Sleep Meditation for Deep Recovery',
        channel: 'Goodful',
        duration: '20:00',
        views: '5.6M views',
        publishedDate: '2 years ago',
        description: 'Unwind your mind, breathe naturally, and ease into a restorative, deep sleep.',
        youtubeUrl: 'https://www.youtube.com/watch?v=aPz224nPV6E',
        thumbnail: 'https://i3.ytimg.com/vi/aPz224nPV6E/hqdefault.jpg'
      },
      {
        categorySlug: 'sleep',
        title: 'Sleep Talk Down Spoken Sleep Meditation',
        channel: 'Jason Stephenson',
        duration: '30:00',
        views: '6.4M views',
        publishedDate: '3 years ago',
        description: 'A guided bedtime scan to help you release daytime tension and float into rest.',
        youtubeUrl: 'https://www.youtube.com/watch?v=vK1d_V_C-8s',
        thumbnail: 'https://i3.ytimg.com/vi/vK1d_V_C-8s/hqdefault.jpg'
      },
      {
        categorySlug: 'sleep',
        title: 'Guided Sleep Meditation for Anxiety & Sleep Hypnosis',
        channel: 'Jason Stephenson',
        duration: '40:00',
        views: '12M views',
        publishedDate: '2 years ago',
        description: 'Enter a state of deep sleep recovery with this relaxing guided anxiety release session.',
        youtubeUrl: 'https://www.youtube.com/watch?v=7K4a-J8E4vA',
        thumbnail: 'https://i3.ytimg.com/vi/7K4a-J8E4vA/hqdefault.jpg'
      },
      {
        categorySlug: 'sleep',
        title: 'Hypnosis to Declutter Your Mind Before Deep Sleep',
        channel: 'Michael Sealey',
        duration: '50:00',
        views: '15M views',
        publishedDate: '3 years ago',
        description: 'A short guided meditation to ease your mind and prepare your body for sleep.',
        youtubeUrl: 'https://www.youtube.com/watch?v=g52-w0qA6a4',
        thumbnail: 'https://i3.ytimg.com/vi/g52-w0qA6a4/hqdefault.jpg'
      },
      {
        categorySlug: 'sleep',
        title: 'Sleep Hypnosis for Clearing Subconscious Anxiety',
        channel: 'Michael Sealey',
        duration: '45:15',
        views: '4.8M views',
        publishedDate: '2 years ago',
        description: 'Gently soothe your autonomic nervous system and transition into deep sleep.',
        youtubeUrl: 'https://www.youtube.com/watch?v=3x3-HwS6mIQ',
        thumbnail: 'https://i3.ytimg.com/vi/3x3-HwS6mIQ/hqdefault.jpg'
      },

      // Anxiety
      {
        categorySlug: 'anxiety',
        title: '10-Minute Meditation for Anxiety & Panic Reset',
        channel: 'Goodful',
        duration: '10:00',
        views: '6.8M views',
        publishedDate: '3 years ago',
        description: 'Ground yourself during moments of acute anxiety or overwhelming worry loops.',
        youtubeUrl: 'https://www.youtube.com/watch?v=Jyy0ra2WcQQ',
        thumbnail: 'https://img.youtube.com/vi/Jyy0ra2WcQQ/hqdefault.jpg'
      },
      {
        categorySlug: 'anxiety',
        title: '10 Minute Meditation for Anxiety & Fear Control',
        channel: 'Great Meditation',
        duration: '10:00',
        views: '2.1M views',
        publishedDate: '1 year ago',
        description: 'Refocus your mind and calm your body with this comforting guided breathing session.',
        youtubeUrl: 'https://www.youtube.com/watch?v=O-6f5wQXSu8',
        thumbnail: 'https://img.youtube.com/vi/O-6f5wQXSu8/hqdefault.jpg'
      },
      {
        categorySlug: 'anxiety',
        title: '15-Minute Yoga/Mindfulness for Anxiety Relief',
        channel: 'Yoga With Adriene',
        duration: '15:00',
        views: '5.4M views',
        publishedDate: '2 years ago',
        description: 'A comforting guided breathing and movement space to release physical worry patterns.',
        youtubeUrl: 'https://www.youtube.com/watch?v=bJJWArRfKa0',
        thumbnail: 'https://img.youtube.com/vi/bJJWArRfKa0/hqdefault.jpg'
      },
      {
        categorySlug: 'anxiety',
        title: 'Guided Meditation for Detachment From Over-Thinking',
        channel: 'Michael Sealey',
        duration: '35:10',
        views: '30M views',
        publishedDate: '4 years ago',
        description: 'Quiet your inner critic, release physical tension, and soothe baseline anxiety.',
        youtubeUrl: 'https://www.youtube.com/watch?v=jbw8VSkWxxs',
        thumbnail: 'https://img.youtube.com/vi/jbw8VSkWxxs/hqdefault.jpg'
      },
      {
        categorySlug: 'anxiety',
        title: '10-Minute Guided Meditation to Boost Calmness',
        channel: 'Declutter The Mind',
        duration: '10:00',
        views: '4.5M views',
        publishedDate: '2 years ago',
        description: 'Learn noting techniques to label distractions and find absolute mental calm.',
        youtubeUrl: 'https://www.youtube.com/watch?v=ZToicYcHIOU',
        thumbnail: 'https://img.youtube.com/vi/ZToicYcHIOU/hqdefault.jpg'
      },

      // Focus
      {
        categorySlug: 'focus',
        title: 'Meditation for Focus, Clarity & Concentration',
        channel: 'Goodful',
        duration: '12:00',
        views: '1.5M views',
        publishedDate: '1 year ago',
        description: 'Train your attention muscle and clear mental fatigue with this grounding practice.',
        youtubeUrl: 'https://www.youtube.com/watch?v=inpok4MKVLM',
        thumbnail: 'https://img.youtube.com/vi/inpok4MKVLM/hqdefault.jpg'
      },
      {
        categorySlug: 'focus',
        title: '10-Minute Focus & Attention Meditation',
        channel: 'Declutter The Mind',
        duration: '10:00',
        views: '2.3M views',
        publishedDate: '2 years ago',
        description: 'A guided focus block to help you improve concentration and steady your thoughts.',
        youtubeUrl: 'https://www.youtube.com/watch?v=Lco1LSrr2yM',
        thumbnail: 'https://img.youtube.com/vi/Lco1LSrr2yM/hqdefault.jpg'
      },
      {
        categorySlug: 'focus',
        title: '10 Minute Meditation for Focus & Clarity',
        channel: 'Great Meditation',
        duration: '10:00',
        views: '920K views',
        publishedDate: '8 months ago',
        description: 'Banish distractions and bring clear intention to your next block of work.',
        youtubeUrl: 'https://www.youtube.com/watch?v=Lco1LSrr2yM',
        thumbnail: 'https://img.youtube.com/vi/Lco1LSrr2yM/hqdefault.jpg'
      },
      {
        categorySlug: 'focus',
        title: '10 Minute Guided Meditation for Focus & Productivity',
        channel: 'Great Meditation',
        duration: '10:00',
        views: '1.1M views',
        publishedDate: '2 years ago',
        description: 'Calm the clutter of multitasking and find deep, sustained work momentum.',
        youtubeUrl: 'https://www.youtube.com/watch?v=O-6f5wQXSu8',
        thumbnail: 'https://img.youtube.com/vi/O-6f5wQXSu8/hqdefault.jpg'
      },
      {
        categorySlug: 'focus',
        title: 'Unwavering Focus',
        channel: 'Dandapani (TEDx)',
        duration: '18:32',
        views: '6.2M views',
        publishedDate: '3 years ago',
        description: 'A former monk explains how concentration is a muscle and shares practical tools to cultivate focus.',
        youtubeUrl: 'https://www.youtube.com/watch?v=4O2JK_94g3Y',
        thumbnail: 'https://img.youtube.com/vi/4O2JK_94g3Y/hqdefault.jpg'
      },

      // Self Love
      {
        categorySlug: 'self-love',
        title: 'Guided Meditation for Self Love & Compassion',
        channel: 'Yoga With Adriene',
        duration: '13:00',
        views: '3.9M views',
        publishedDate: '2 years ago',
        description: 'A gentle guided practice to cultivate self-compassion, acceptance, and peace.',
        youtubeUrl: 'https://www.youtube.com/watch?v=z7OjaV-mPqY',
        thumbnail: 'https://i3.ytimg.com/vi/z7OjaV-mPqY/hqdefault.jpg'
      },
      {
        categorySlug: 'self-love',
        title: '5 Minute Morning Meditation for Relaxation & Positive Energy',
        channel: 'Lavendaire',
        duration: '05:00',
        views: '2.4M views',
        publishedDate: '1 year ago',
        description: 'Honour your values, accept your journey, and build steady self confidence.',
        youtubeUrl: 'https://www.youtube.com/watch?v=VpHz8Mb13_Y',
        thumbnail: 'https://i3.ytimg.com/vi/VpHz8Mb13_Y/hqdefault.jpg'
      },
      {
        categorySlug: 'self-love',
        title: 'Self Love Sleep Meditation: Sleep Hypnosis',
        channel: 'Jason Stephenson',
        duration: '40:00',
        views: '1.7M views',
        publishedDate: '2 years ago',
        description: 'Redirect kindness inward to soothe self-doubt and build inner confidence.',
        youtubeUrl: 'https://www.youtube.com/watch?v=7K4a-J8E4vA',
        thumbnail: 'https://i3.ytimg.com/vi/7K4a-J8E4vA/hqdefault.jpg'
      },
      {
        categorySlug: 'self-love',
        title: '10-Minute Guided Meditation for Self-Love',
        channel: 'Declutter The Mind',
        duration: '10:00',
        views: '2.8M views',
        publishedDate: '3 years ago',
        description: 'An emotional reset session to cultivate confidence and healing self-talk.',
        youtubeUrl: 'https://www.youtube.com/watch?v=ZToicYcHIOU',
        thumbnail: 'https://i3.ytimg.com/vi/ZToicYcHIOU/hqdefault.jpg'
      },
      {
        categorySlug: 'self-love',
        title: '10 Minute Guided Meditation for Self Compassion',
        channel: 'Great Meditation',
        duration: '10:00',
        views: '980K views',
        publishedDate: '1 year ago',
        description: 'Quiet your inner critic and develop deep, unconditional self-acceptance.',
        youtubeUrl: 'https://www.youtube.com/watch?v=7K4a-J8E4vA',
        thumbnail: 'https://i3.ytimg.com/vi/7K4a-J8E4vA/hqdefault.jpg'
      },

      // Morning
      {
        categorySlug: 'morning',
        title: '5-Minute Morning Meditation for Positive Energy',
        channel: 'Goodful',
        duration: '05:00',
        views: '8.4M views',
        publishedDate: '3 years ago',
        description: 'Awaken your attention and set positive, focused intentions for your morning routine.',
        youtubeUrl: 'https://www.youtube.com/watch?v=inpok4MKVLM',
        thumbnail: 'https://i3.ytimg.com/vi/inpok4MKVLM/hqdefault.jpg'
      },
      {
        categorySlug: 'morning',
        title: '10 Minute Morning Meditation: Wake Up Calm',
        channel: 'Great Meditation',
        duration: '10:00',
        views: '5.2M views',
        publishedDate: '1 year ago',
        description: 'Start your morning with calm energy and clear intention with this quick reset.',
        youtubeUrl: 'https://www.youtube.com/watch?v=inpok4MKVLM',
        thumbnail: 'https://i3.ytimg.com/vi/inpok4MKVLM/hqdefault.jpg'
      },
      {
        categorySlug: 'morning',
        title: '5 Minute Morning Meditation for Relaxation & Positive Energy',
        channel: 'Lavendaire',
        duration: '05:00',
        views: '3.1M views',
        publishedDate: '2 years ago',
        description: 'A quick morning breathing space to ground your focus before check-in.',
        youtubeUrl: 'https://www.youtube.com/watch?v=VpHz8Mb13_Y',
        thumbnail: 'https://i3.ytimg.com/vi/VpHz8Mb13_Y/hqdefault.jpg'
      },
      {
        categorySlug: 'morning',
        title: 'Morning Meditation: Positive Energy Flow',
        channel: 'Jason Stephenson',
        duration: '12:15',
        views: '2.1M views',
        publishedDate: '2 years ago',
        description: 'A mindful routine of breathing and movement to welcome the morning with energy.',
        youtubeUrl: 'https://www.youtube.com/watch?v=v7AYKzOFzq0',
        thumbnail: 'https://i3.ytimg.com/vi/v7AYKzOFzq0/hqdefault.jpg'
      },
      {
        categorySlug: 'morning',
        title: '9-Minute Morning Wake Up Meditation',
        channel: 'Yoga With Adriene',
        duration: '09:00',
        views: '4.8M views',
        publishedDate: '2 years ago',
        description: 'A short morning breathing reset to fill your day with positive, focused energy.',
        youtubeUrl: 'https://www.youtube.com/watch?v=g-jcWC9_L3k',
        thumbnail: 'https://i3.ytimg.com/vi/g-jcWC9_L3k/hqdefault.jpg'
      }
    ]);
    console.log('✅ Meditation Videos seeded successfully!');
    }
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
  }
};
