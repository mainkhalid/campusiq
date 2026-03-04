// src/hooks/useApi.js
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import api from '../api/axios'

export function useApi(endpoint) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get(endpoint)
      // DRF returns paginated results as { count, results: [] }
      // Non-paginated returns array directly
      // Handle both shapes transparently
      setData(response.data.results ?? response.data)
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const create = async (payload) => {
    try {
      const response = await api.post(endpoint, payload)
      toast.success('Created successfully!')
      fetchData()
      return response.data
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create')
      throw error
    }
  }

  const update = async (id, payload) => {
    try {
      const response = await api.put(`${endpoint}${id}/`, payload)
      toast.success('Updated successfully!')
      fetchData()
      return response.data
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update')
      throw error
    }
  }

  const remove = async (id) => {
    try {
      await api.delete(`${endpoint}${id}/`)
      toast.success('Deleted successfully!')
      fetchData()
    } catch (error) {
      toast.error('Failed to delete')
      throw error
    }
  }

  return { data, loading, fetchData, create, update, remove }
}