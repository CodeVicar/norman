import React from 'react';

const TestimonialCard = ({ quote, author, source }) => (
  <div className="bg-white rounded-lg shadow-lg p-6 text-center flex flex-col h-full">
    <p className="text-gray-700 italic mb-4 flex-grow">"{quote}"</p>
    <div className="text-gray-900 font-semibold mt-auto">{author}</div>
    {source && <div className="text-gray-600 text-sm">{source}</div>}
  </div>
);

const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "This online recorder is incredibly easy to use and delivers high-quality video. It saved me so much time!",
      author: "Alex J.",
      source: "Content Creator"
    },
    {
      quote: "Finally, a free online screen recorder that just works. No hidden catches, no watermarks, just simple recording.",
      author: "Maria P.",
      source: "Educator"
    },
    {
      quote: "I love the flexibility to record screen, camera, or both. Perfect for tutorials and presentations.",
      author: "Sam C.",
      source: "Software Developer"
    },
  ];

  return (
    <section className="py-20 px-4 bg-gray-100">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Trusted by Users Worldwide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>
         {/* You can add a rating or review summary here later if desired */}
         {/* <div className="mt-12 text-center text-gray-700">
            Overall rating 4.8 out of 5 based on 100+ reviews
         </div> */}
      </div>
    </section>
  );
};

export default TestimonialsSection; 