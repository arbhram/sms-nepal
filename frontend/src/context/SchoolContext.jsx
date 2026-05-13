import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const SchoolContext = createContext(null);

export function SchoolProvider({ children }) {
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get('/api/school/current')
      .then((res) => setSchool(res.data))   // null on bare localhost, object on subdomain
      .catch(() => setSchool(null))
      .finally(() => setLoading(false));
  }, []);

  // Apply school's primary color as a CSS variable
  useEffect(() => {
    if (school?.primaryColor) {
      document.documentElement.style.setProperty('--color-brand', school.primaryColor);
    }
  }, [school?.primaryColor]);

  return (
    <SchoolContext.Provider value={{ school, loading }}>
      {children}
    </SchoolContext.Provider>
  );
}

export const useSchool = () => useContext(SchoolContext);
