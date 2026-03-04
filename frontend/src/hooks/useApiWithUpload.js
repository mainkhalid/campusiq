// src/hooks/useApiWithUpload.js
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import api from '../api/axios'

export function useApiWithUpload(endpoint) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get(endpoint)
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

  const createWithFile = async (formData) => {
    try {
      const response = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Created successfully!')
      fetchData()
      return response.data
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create')
      throw error
    }
  }

  const updateWithFile = async (id, formData) => {
    try {
      // PATCH for partial updates — required when FormData
      // doesn't include the image (no new file uploaded)
      const response = await api.patch(`${endpoint}${id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
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

  const patch = async (id, payload) => {
    try {
      const response = await api.patch(`${endpoint}${id}/`, payload)
      fetchData()
      return response.data
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update')
      throw error
    }
  }

  return { data, loading, fetchData, createWithFile, updateWithFile, remove, patch }
}