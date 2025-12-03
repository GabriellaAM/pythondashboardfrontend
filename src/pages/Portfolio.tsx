import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import PortfolioDashboardByCarteira from '../components/PortfolioDashboardByCarteira';

const Portfolio: React.FC = () => {
  const { carteira } = useParams<{ carteira: string }>();
  
  // Se não houver carteira na URL, redirecionar para EXC
  if (!carteira) {
    return <Navigate to="/portfolio/EXC" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <PortfolioDashboardByCarteira carteira={carteira} />
    </div>
  );
};

export default Portfolio;
