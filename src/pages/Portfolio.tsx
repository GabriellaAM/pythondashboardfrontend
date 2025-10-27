import React from 'react';
import { Helmet } from 'react-helmet-async';
import PortfolioDashboard from '../components/PortfolioDashboard';

const Portfolio: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Portfolio - DataViz Dashboard</title>
        <meta name="description" content="Análise completa do portfolio de criptomoedas" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        <PortfolioDashboard />
      </div>
    </>
  );
};

export default Portfolio;
