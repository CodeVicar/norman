import React from 'react';

const AIToolCard = ({ icon, title, description }) => (
  <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-lg h-full">
    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mb-4 text-white text-xl">{icon}</div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 flex-grow">{description}</p>
  </div>
);

const AIToolsSection = () => {
  // These are example AI tool features. Adjust based on your application's actual or planned features.
  const aiTools = [
    {
      icon: "✍️",
      title: "Auto Captions",
      description: "Automatically generate accurate captions for your recordings to improve accessibility and engagement."
    },
    {
      icon: "🌐",
      title: "Global Languages",
      description: "Reach a wider audience with auto-translated captions in multiple languages."
    },
    {
      icon: "📊",
      title: "Content Analysis",
      description: "Get insights into your content with AI-powered analysis (placeholder feature)."
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-purple-600 to-blue-700 text-white">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Save Time with Smart Video Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {aiTools.map((tool, index) => (
            <AIToolCard key={index} {...tool} />
          ))}
        </div>
         {/* Add a call to action related to these tools if applicable */}
         {/* <div className="text-center mt-12">
            <button className="px-8 py-3 bg-white text-purple-700 font-semibold rounded-full shadow-lg hover:bg-gray-200 transition-colors text-lg">
              Explore Smart Features
            </button>
         </div> */}
      </div>
    </section>
  );
};

export default AIToolsSection; 