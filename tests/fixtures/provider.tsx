import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { StockProvider, useStock } from '../../src/context/StockContext';
function Fixture() {
  const context = useStock();
  useEffect(() => { (window as unknown as { myofficeTest: typeof context }).myofficeTest = context; }, [context]);
  return <p>Isolated provider regression fixture; never included in production build.</p>;
}
createRoot(document.getElementById('root')!).render(<StockProvider><Fixture /></StockProvider>);
