import React from 'react'
import HeroSection from '../components/HeroSection'
import Features from '../components/Features'
import ProgrammesSection from '../components/ProgrammeSection'
import ResearchHighlight from '../components/ResearchHighlight'
import AIShowcase from '../components/AiShowcase'
import NewsEvents from '../components/NewsEvents'

const Study = () => {
  return (
    <div>
      <HeroSection />
      <Features />
      <ResearchHighlight />
      <ProgrammesSection />
      <NewsEvents />
      <AIShowcase />
    </div>
  )
}

export default Study
