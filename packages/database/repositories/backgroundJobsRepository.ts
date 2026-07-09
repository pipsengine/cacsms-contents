import { BaseRepository } from './baseRepository'
import { getConnectionPool } from '../connection'

export const backgroundJobsRepository = new (class BackgroundJobsRepository extends BaseRepository {
  constructor() {
    super('background_jobs')
  }

  async getBackgroundJobsDashboard() {
    const pool = await getConnectionPool()
    const result = await pool.request().query(`
      SELECT bj.name, bj.status, bj.priority, bj.progress_percent, jq.name AS queue_name, bj.created_at, bj.started_at, bj.completed_at
      FROM background_jobs bj
      LEFT JOIN job_queues jq ON jq.id = bj.job_queue_id
      WHERE bj.is_deleted = 0
      ORDER BY bj.created_at DESC
    `)
    return result.recordset
  }
})()
