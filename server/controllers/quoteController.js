import Quote from '../models/Quote.js';

export const SEED_QUOTES = [
  { quote: "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.", author: "Thich Nhat Hanh" },
  { quote: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh" },
  { quote: "Be here now.", author: "Ram Dass" },
  { quote: "Quiet the mind and the soul will speak.", author: "Ma Jaya Sati Bhagavati" },
  { quote: "Mindfulness isn't difficult, we just need to remember to do it.", author: "Sharon Salzberg" },
  { quote: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha" },
  { quote: "Peace comes from within. Do not seek it without.", author: "Buddha" },
  { quote: "The primary cause of unhappiness is never the situation but your thoughts about it.", author: "Eckhart Tolle" },
  { quote: "Realize deeply that the present moment is all you have. Make the NOW the primary focus of your life.", author: "Eckhart Tolle" },
  { quote: "No amount of anxiety makes any difference to anything that is going to happen.", author: "Alan Watts" },
  { quote: "This too shall pass.", author: "Unknown" },
  { quote: "You, yourself, as much as anybody in the entire universe, deserve your love and affection.", author: "Buddha" },
  { quote: "Love yourself first and everything else falls into line.", author: "Lucille Ball" },
  { quote: "Talk to yourself like you would to someone you love.", author: "Brené Brown" },
  { quote: "Owning our story and loving ourselves through that process is the bravest thing that we’ll ever do.", author: "Brené Brown" },
  { quote: "Self-care is never a selfish act—it is simply good stewardship of the only gift I have.", author: "Parker Palmer" },
  { quote: "An empty lantern provides no light. Self-care is the fuel that allows your light to shine.", author: "Unknown" },
  { quote: "Almost everything will work again if you unplug it for a few minutes, including you.", author: "Anne Lamott" },
  { quote: "Rule your mind or it will rule you.", author: "Horace" },
  { quote: "Your mind is a garden. Your thoughts are the seeds. You can grow flowers or weeds.", author: "Unknown" },
  { quote: "The greatest weapon against stress is our ability to choose one thought over another.", author: "William James" },
  { quote: "Slow down and everything you are chasing will come around and catch you.", author: "John De Paola" },
  { quote: "Calmness is the cradle of power.", author: "Josiah Gilbert Holland" },
  { quote: "Within you, there is a stillness and a sanctuary to which you can retreat at any time.", author: "Hermann Hesse" },
  { quote: "Emotional pain cannot kill you, but running from it can. Stand still. Feel it.", author: "Unknown" },
  { quote: "The oak fought the wind and was broken, the willow bent when it must and survived.", author: "Robert Jordan" },
  { quote: "Resilience is accepting your new reality, even if it's less good than the one you had before.", author: "Elizabeth Edwards" },
  { quote: "Wear your growth like a badge of honor. It took courage to get here.", author: "Unknown" },
  { quote: "Growth is painful. Change is painful. But nothing is as painful as staying stuck.", author: "N.R. Narayana Murthy" },
  { quote: "The only journey is the one within.", author: "Rainer Maria Rilke" },
  { quote: "Gratitude turns what we have into enough.", author: "Aesop" },
  { quote: "Gratitude is a powerful catalyst for happiness. It’s the spark that lights joy.", author: "Amy Collette" },
  { quote: "Enjoy the little things, for one day you may realize they were the big things.", author: "Robert Brault" },
  { quote: "Keep your face always toward the sunshine—and shadows will fall behind you.", author: "Walt Whitman" },
  { quote: "Write it on your heart that every day is the best day in the year.", author: "Ralph Waldo Emerson" },
  { quote: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama" },
  { quote: "Choose to be optimistic, it feels better.", author: "Dalai Lama" },
  { quote: "If you want others to be happy, practice compassion. If you want to be happy, practice compassion.", author: "Dalai Lama" },
  { quote: "Hope is the thing with feathers that perches in the soul and sings the tune.", author: "Emily Dickinson" },
  { quote: "Only in the darkness can you see the stars.", author: "Martin Luther King Jr." },
  { quote: "Learn from yesterday, live for today, hope for tomorrow.", author: "Albert Einstein" },
  { quote: "May your choices reflect your hopes, not your fears.", author: "Nelson Mandela" },
  { quote: "The range of what we think and do is limited by what we fail to notice.", author: "R.D. Laing" },
  { quote: "Breath is the finest gift of nature. Be grateful for this breath.", author: "Amit Ray" },
  { quote: "Mindfulness is the aware, balanced acceptance of the present experience.", author: "Sylvia Boorstein" },
  { quote: "The soul usually knows what to do to heal itself. The challenge is to silence the mind.", author: "Caroline Myss" },
  { quote: "To understand everything is to forgive everything.", author: "Buddha" },
  { quote: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { quote: "What you seek is seeking you.", author: "Rumi" },
  { quote: "Don't grieve. Anything you lose comes round in another form.", author: "Rumi" },
  { quote: "The wound is the place where the Light enters you.", author: "Rumi" },
  { quote: "Respond to every call that excites your spirit.", author: "Rumi" },
  { quote: "Very little is needed to make a happy life; it is all within yourself.", author: "Marcus Aurelius" },
  { quote: "Accept the things to which fate binds you, and love the people with whom fate brings you.", author: "Marcus Aurelius" },
  { quote: "You have power over your mind - not outside events. Realize this, and find strength.", author: "Marcus Aurelius" },
  { quote: "If you are depressed you are living in the past. If you are anxious you are living in the future.", author: "Lao Tzu" },
  { quote: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu" },
  { quote: "Be content with what you have; rejoice in the way things are.", author: "Lao Tzu" },
  { quote: "To the mind that is still, the whole universe surrenders.", author: "Lao Tzu" },
  { quote: "You should sit in meditation for twenty minutes every day — unless you're too busy; then sit for an hour.", author: "Zen Proverb" }
];

/**
 * Helper to get a new rotated quote when today's quote expires or doesn't exist
 */
const rotateQuote = async (currentQuote) => {
  // Clear the current active quote if it exists
  if (currentQuote) {
    currentQuote.isToday = false;
    await currentQuote.save();
  }

  // Find the next quote in rotation: sort by lastShownAt ascending (nulls come first)
  // Exclude currentQuote to prevent immediate repetition
  const filter = currentQuote ? { _id: { $ne: currentQuote._id } } : {};
  let nextQuote = await Quote.findOne(filter).sort({ lastShownAt: 1 });

  if (!nextQuote) {
    // If no other quote exists, fall back to any quote including current
    nextQuote = await Quote.findOne().sort({ lastShownAt: 1 });
  }

  if (nextQuote) {
    nextQuote.isToday = true;
    nextQuote.lastShownAt = new Date();
    await nextQuote.save();
  }

  return nextQuote;
};

/**
 * @desc    Get today's quote (automatically rotates every 24 hours)
 * @route   GET /api/quotes/today
 * @access  Private
 */
export const getTodayQuote = async (req, res) => {
  try {
    // Auto seed if empty
    const count = await Quote.countDocuments();
    if (count === 0) {
      await Quote.create(SEED_QUOTES);
    }

    let todayQuote = await Quote.findOne({ isToday: true });

    if (!todayQuote) {
      todayQuote = await rotateQuote(null);
    } else {
      // Check if it's a new day (24 hours check or different calendar date)
      const lastShown = new Date(todayQuote.lastShownAt);
      const today = new Date();
      if (lastShown.toDateString() !== today.toDateString()) {
        todayQuote = await rotateQuote(todayQuote);
      }
    }

    if (!todayQuote) {
      return res.status(404).json({ success: false, message: "No quotes available" });
    }

    res.status(200).json({ success: true, quote: todayQuote });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get a different random quote immediately and persist it as today's quote
 * @route   GET /api/quotes/random
 * @access  Private
 */
export const getRandomQuote = async (req, res) => {
  try {
    const currentQuote = await Quote.findOne({ isToday: true });
    
    // Find all other quotes
    const filter = currentQuote ? { _id: { $ne: currentQuote._id } } : {};
    const otherQuotesCount = await Quote.countDocuments(filter);

    if (otherQuotesCount === 0) {
      // If only one quote exists, return it
      return res.status(200).json({ success: true, quote: currentQuote });
    }

    const randomIndex = Math.floor(Math.random() * otherQuotesCount);
    const nextQuote = await Quote.findOne(filter).skip(randomIndex);

    if (currentQuote) {
      currentQuote.isToday = false;
      await currentQuote.save();
    }

    nextQuote.isToday = true;
    nextQuote.lastShownAt = new Date();
    await nextQuote.save();

    res.status(200).json({ success: true, quote: nextQuote });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Seed quotes collection manually (if not done automatically)
 * @route   POST /api/quotes/seed
 * @access  Private
 */
export const seedQuotesCollection = async (req, res) => {
  try {
    const count = await Quote.countDocuments();
    if (count > 0) {
      return res.status(200).json({ success: true, message: "Quotes collection already seeded", count });
    }

    const seeded = await Quote.create(SEED_QUOTES);
    res.status(201).json({ success: true, message: "Seeded quotes successfully", count: seeded.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
