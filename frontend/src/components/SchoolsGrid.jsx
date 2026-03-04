import React from 'react';

const SchoolsGrid = () => {
  const courses = [
  {
    title: "ICT, Media & Engineering",
    description: "Innovative programs in information technology, digital media, and engineering focused on solving real-world problems.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    size: "row-span-2",
  },
  {
    title: "Health Sciences",
    description: "Professional training in nursing, public health, and allied health sciences with strong clinical foundations.",
    image: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=800&q=80",
    size: "col-span-2",
  },
  {
    title: "Business & Economics",
    description: "Develop leadership, entrepreneurship, and analytical skills for success in global and local economies.",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    size: "",
  },
  {
    title: "Law",
    description: "A rigorous legal education preparing graduates for advocacy, governance, and justice in society.",
    bgColor: "bg-[#76d2d1]",
    size: "",
  },
  {
    title: "Education, Arts & Social Sciences",
    description: "Explore teaching, humanities, and social sciences to shape culture, policy, and community development.",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80",
    size: "col-span-2",
  },
];


  return (
    <section className="py-16 bg-white max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[200px]">
        {courses.map((course, index) => (
          <div
            key={index}
            className={`relative overflow-hidden rounded-md group cursor-pointer transition-transform duration-300 hover:scale-[1.01] ${course.size} ${course.bgColor || 'bg-slate-900'}`}
          >
            {/* Background Image  Overlay */}
            {course.image && (
  <>
    <img 
      src={course.image} 
      alt={course.title}
      className="absolute inset-0 w-full h-full object-cover contrast-110 brightness-110 transition-transform duration-500 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
  </>
)}
            {/* Content */}
            <div className={`relative h-full p-6 flex flex-col justify-end ${!course.image ? 'text-gray-600' : 'text-white'}`}>
              <h3 className="text-2xl font-bold mb-2">{course.title}</h3>
              <p className={`text-sm leading-snug ${!course.image ? 'text-gray-700' : 'text-gray-200'}`}>
                {course.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SchoolsGrid;