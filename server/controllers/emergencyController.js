/**
 * @desc    Get emergency crisis helplines
 * @route   GET /api/emergency
 * @access  Private
 */
export const getEmergencyData = async (req, res) => {
  try {
    // Static Crisis Resources
    const crisisResources = [
      {
        name: 'National Suicide Prevention Lifeline',
        phone: '988',
        description: 'Free, confidential 24/7 support for anyone in suicidal crisis or emotional distress.',
        type: 'Call or Text',
      },
      {
        name: 'Crisis Text Line',
        phone: 'HOME to 741741',
        description: 'Connect with a volunteer crisis counselor 24/7 via text message.',
        type: 'Text Only',
      },
      {
        name: 'SAMHSA Treatment Helpline',
        phone: '1-800-662-4357',
        description: 'Information service for individuals and families facing mental and/or substance use disorders.',
        type: 'Call Only',
      },
      {
        name: 'The Trevor Project (LGBTQ+)',
        phone: '1-866-488-7386',
        description: 'Crisis intervention and suicide prevention services for lesbian, gay, bisexual, transgender, queer & questioning youth.',
        type: 'Call or Text',
      },
    ];

    res.status(200).json({
      success: true,
      crisisResources,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
