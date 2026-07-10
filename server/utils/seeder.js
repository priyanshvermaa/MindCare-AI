import SupportGroup from '../models/SupportGroup.js';
import Resource from '../models/Resource.js';
import Meditation from '../models/Meditation.js';
import DailyMotivation from '../models/DailyMotivation.js';
import Quote from '../models/Quote.js';
import { SEED_QUOTES } from '../controllers/quoteController.js';
import mongoose from 'mongoose';

export const seedInitialData = async () => {
  try {
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
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
  }
};
