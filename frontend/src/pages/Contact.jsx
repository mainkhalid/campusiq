import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Send,
  MessageSquare,
  Users,
  Building2,
  CheckCircle
} from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 3000);
  };


  const departments = [
    { name: 'Admissions Office', icon: <Users size={20} />, email: 'admissions@zetech.ac.ke' },
    { name: 'Academic Affairs', icon: <Building2 size={20} />, email: 'academics@zetech.ac.ke' },
    { name: 'Student Services', icon: <MessageSquare size={20} />, email: 'students@zetech.ac.ke' },
    { name: 'Finance Office', icon: <Building2 size={20} />, email: 'finance@zetech.ac.ke' }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      
   

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-[#1a2b4c] mb-2">Send us a Message</h2>
              <p className="text-gray-600 mb-6">Fill out the form below and we'll get back to you within 24 hours</p>

              {isSubmitted ? (
                <div className="bg-green-50 border-2 border-green-500 rounded-lg p-8 text-center">
                  <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
                  <h3 className="text-2xl font-bold text-green-700 mb-2">Message Sent!</h3>
                  <p className="text-gray-600">Thank you for contacting us. We'll respond shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input 
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                        placeholder="Walter White"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input 
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
                        placeholder="student@gmail.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input 
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                        placeholder="+254 700 000 000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Subject *
                      </label>
                      <select 
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        <option value="">Select a subject</option>
                        <option value="admissions">Admissions Inquiry</option>
                        <option value="programs">Program Information</option>
                        <option value="fees">Fee Structure</option>
                        <option value="general">General Inquiry</option>
                        <option value="support">Technical Support</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea 
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="6"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="Tell us how we can help you..."
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Send size={20} />
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Departments */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-[#1a2b4c] mb-4">Quick Contact</h3>
              <div className="space-y-3">
                {departments.map((dept, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer group"
                  >
                    <div className="text-orange-500 group-hover:text-orange-600 mt-1">
                      {dept.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-700">{dept.name}</p>
                      <p className="text-xs text-gray-500">{dept.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-[#1a2b4c] mb-4">Find Us</h3>
              <div className="bg-gray-200 rounded-lg h-48 flex items-center justify-center">
                <MapPin size={48} className="text-gray-400" />
              </div>
              <button className="w-full mt-4 bg-[#1a2b4c] hover:bg-[#2d4263] text-white py-3 rounded-lg font-semibold transition-colors">
                Get Directions
              </button>
            </div>

            {/* Emergency Contact */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Need Urgent Help?</h3>
              <p className="text-sm mb-4 text-orange-100">Our admissions team is available to assist you</p>
              <a 
                href="tel:+254709912000"
                className="block bg-white text-orange-600 py-3 rounded-lg font-bold text-center hover:bg-orange-50 transition-colors"
              >
                Call +254 709 912 000
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;