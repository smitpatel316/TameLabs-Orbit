
import React, { createContext, useContext } from 'react';
import { logger } from '../utils/logger';

interface TelemetryContextType {
  logEvent: (name: string, props?: any) => void;
  startScreen: (screen: string) => void;
  stopScreen: (screen: string) => void;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TelemetryContext.Provider value={{
      logEvent: (name, props) => logger.event(name, props),
      startScreen: (screen) => logger.info('telemetry', `start_screen: ${screen}`),
      stopScreen: (screen) => logger.info('telemetry', `stop_screen: ${screen}`),
    }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) throw new Error('useTelemetry must be used within a TelemetryProvider');
  return context;
};
