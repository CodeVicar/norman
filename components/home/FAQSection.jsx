import React from 'react';

// Simple component for a single FAQ item
const FAQItem = ({ question, answer }) => (
  <div className="border-b border-gray-200 py-6 last:border-b-0">
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{question}</h3>
    <p className="text-gray-600">{answer}</p>
  </div>
);

const FAQSection = () => {
  const faqs = [
    {
      question: "What is this online recorder?",
      answer: "It's a free, browser-based tool that allows you to record your screen, camera, audio, or a combination of these, without needing to download any software or extensions."
    },
    {
      question: "Is the online recorder free to use?",
      answer: "Yes, our online recorder is completely free with no hidden costs, watermarks, or time limits."
    },
    {
      question: "Do I need to install any software or extensions?",
      answer: "No, the recorder runs entirely in your web browser. You do not need to install anything."
    },
    {
      question: "What browsers are supported?",
      answer: "The online recorder is designed to work with modern web browsers that support the necessary MediaRecorder and getUserMedia/getDisplayMedia APIs, such as Google Chrome, Mozilla Firefox, and Microsoft Edge."
    },
    {
      question: "How do I record my screen?",
      answer: "Navigate to the recorder page and select the 'Screen' option. You will be prompted to choose which screen, window, or tab you want to share. Then click 'Start Recording'."
    },
    {
      question: "Can I record my camera and screen at the same time?",
      answer: "Yes, you can select the 'Screen & Camera' option to record both simultaneously, with your camera feed overlaid on the screen recording."
    },
    {
      question: "How is my recording saved?",
      answer: "Your recording is processed in your browser and can be downloaded directly to your computer once you stop recording. Your recordings are not uploaded to our servers."
    }
  ];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="divide-y divide-gray-200">
          {faqs.map((faq, index) => (
            <FAQItem key={index} {...faq} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection; 