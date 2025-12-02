import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { format } from 'date-fns';
import { frontendCache } from '../../lib/cache';

interface OpenPositionsTableProps {
  carteira: string;
  brl?: boolean;
}

interface PositionData {
  ativo: string;
  ultima_entrada: string | Date;
  dias_em_carteira: number;
  preco_entrada: number;
  preco_atual: number;
  'retorno_acumulado(%)': number;
}

interface ApiData {
  data: PositionData[];
  columns: string[];
}

export function OpenPositionsTable({ carteira, brl = false }: OpenPositionsTableProps) {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check cache first
        const cacheKey = frontendCache.generateKey('/api/portfolio/visualizations/posicoes-abertas', { carteira });
        const cachedData = frontendCache.get<ApiData>(cacheKey);
        
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `http://localhost:8000/api/portfolio/visualizations/posicoes-abertas?carteira=${carteira}`
        );
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }
        
        const result = await response.json();
        frontendCache.set(cacheKey, result);
        setData(result);
        
      } catch (err) {
        console.error('Erro ao buscar dados de posições abertas:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [carteira]);

  const formatDate = (value: string | Date | undefined | null) => {
    if (!value) return 'N/A';
    try {
      const date = typeof value === 'string' ? new Date(value) : value;
      return format(date, 'dd/MM/yyyy');
    } catch {
      return 'N/A';
    }
  };

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return brl ? 'R$ 0,00' : '$0.00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: brl ? 'BRL' : 'USD'
    }).format(value);
  };

  const formatPercentage = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.00%';
    }
    return `${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Posições Abertas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Carregando dados...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Posições Abertas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500 py-4">
            Erro: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Posições Abertas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Nenhuma posição aberta
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Posições Abertas</CardTitle>
        <CardDescription>
          Ordenado por retorno acumulado (%) - decrescente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ativo</TableHead>
                <TableHead>Última Entrada</TableHead>
                <TableHead>Dias</TableHead>
                <TableHead className="text-right">Preço Entrada</TableHead>
                <TableHead className="text-right">Preço Atual</TableHead>
                <TableHead className="text-right">Retorno (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((posicao, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{posicao.ativo || 'N/A'}</TableCell>
                  <TableCell>{formatDate(posicao.ultima_entrada)}</TableCell>
                  <TableCell>{posicao.dias_em_carteira || 0}</TableCell>
                  <TableCell className="text-right">{formatCurrency(posicao.preco_entrada)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(posicao.preco_atual)}</TableCell>
                  <TableCell className={`text-right font-medium ${(posicao['retorno_acumulado(%)'] || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(posicao['retorno_acumulado(%)'])}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

