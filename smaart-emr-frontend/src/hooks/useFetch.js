// =========================================================
// useFetch HOOK - Generic data fetching hook with error handling
// =========================================================
import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

/**
 * Custom hook for fetching data with loading, error, and retry logic
 * @param {string} url - API endpoint
 * @param {boolean} skip - Skip fetching if true
 * @param {array} dependencies - Extra dependencies for useEffect
 */
const useFetch = (url, skip = false, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (skip) return;

    try {
      setLoading(true);
      setError(null);
      const response = await api.get(url);
      setData(response.data?.data || response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to fetch data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url, skip, ...dependencies]);

  const refetch = () => {
    fetchData();
  };

  return { data, loading, error, refetch };
};

export default useFetch;
