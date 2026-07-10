import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateOrchestratedAIResponse } from '../services/aiService.js';

// Load env variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const runTests = async () => {
  console.log('🧪 Starting AI Assistant pipeline verification tests...');
  
  const testUserId = '66624a4d6531323334353637'; // Mock MongoDB ObjectId
  const chatHistory = [];
  const userContext = 'User Profile & Recent Telemetry Summary:\n- Last logged mood: Happy (Intensity: 8/10)\n- Sleep: 7.5h\n- Water Intake: 1800 ml';

  const testCases = [
    "I have anxiety attacks.",
    "What is JavaScript?",
    "Tell me a joke.",
    "Who is Elon Musk?",
    "Help me sleep."
  ];

  for (const query of testCases) {
    console.log(`\n--------------------------------------------`);
    console.log(`📝 Testing Query: "${query}"`);
    console.log(`--------------------------------------------`);
    
    try {
      const reply = await generateOrchestratedAIResponse(
        testUserId,
        chatHistory,
        query,
        userContext
      );
      console.log(`💡 Response:\n${reply}`);
    } catch (err) {
      console.error(`❌ Test failed for "${query}":`, err.message);
    }
  }

  console.log('\n🏁 Verification tests complete!');
};

runTests();
