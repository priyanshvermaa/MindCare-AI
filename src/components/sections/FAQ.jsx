import React from 'react';
import { Accordion } from '../ui/Accordion';

export const FAQ = () => {
  const faqItems = [
    {
      question: 'Is employee conversational data completely confidential?',
      answer: 'Yes, absolutely. MindCare AI is built with zero-knowledge data isolation. Individual logs, chats, and exercises are fully encrypted and never shared with employers. Administrators only receive high-level, aggregate wellbeing indexes for departments with 10 or more active members to protect individual identities.'
    },
    {
      question: 'Is the conversational AI coaching clinically validated?',
      answer: 'Yes. Our dialogue paths, stress mitigation labs, and CBT frameworks are co-developed with clinical psychologists and researchers. MindCare AI adapts somatic relaxation practices, mood tracking, and cognitive-behavioral exercises that are clinically proven to decrease stress and build long-term psychological resilience.'
    },
    {
      question: 'How does the platform handle emergency or acute crisis situations?',
      answer: 'Safety is our highest priority. MindCare Copilot features real-time semantic analysis to identify immediate crises or self-harm indicators. If triggered, the AI pauses standard coaching, provides immediate de-escalation guidelines, and displays warm clinical routes to emergency hotlines or internal company EAP resources.'
    },
    {
      question: 'Can we integrate MindCare into Slack, Microsoft Teams, or Discord?',
      answer: 'Yes. MindCare provides official applications for Slack and Microsoft Teams, allowing employees to prompt the assistant, log moods, and perform short breathing exercises natively from their primary workplace chat without opening a new tab.'
    },
    {
      question: 'What is the deployment timeline for enterprise teams?',
      answer: 'Standard setups (Slack/Teams configurations + basic analytics access) can be launched in under 10 minutes. Custom single sign-on (SSO), HRIS syncs, and advanced data export API integrations typically require 2 to 3 business days, assisted by a dedicated customer success manager.'
    }
  ];

  return (
    <section id="faq" className="py-24 relative overflow-hidden bg-white">
      <div className="absolute top-10 right-10 w-96 h-96 bg-[#7C5CFC]/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-4xl mx-auto px-6 md:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#7C5CFC] mb-3">
            Questions & Answers
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C5CFC] to-[#A78BFA]">Questions</span>
          </p>
        </div>

        {/* Accordion Component */}
        <Accordion items={faqItems} className="shadow-lg shadow-purple-100/20" />
      </div>
    </section>
  );
};
