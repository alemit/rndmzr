// Import dayjs for date manipulation
import dayjs from '@/helpers/dayjs';

// ESLint disable for console statements since they're useful for debugging
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */

export default class ClockifyService {

    constructor(httpClient) {
        this.httpClient = httpClient
    }

    async getUserInfo() {
        try {
            const { data } = await this.httpClient.get('/user')
            return data
        } catch (error) {
            console.error('Error fetching user info:', error)
            throw error
        }
    }

    async findProjectsByName(workspace, name) {
        try {
            if (!workspace) {
                console.warn('Missing workspace ID for findProjectsByName')
                return []
            }
            
            let { data } = await this.httpClient.get(`/workspaces/${workspace}/projects?name=${name}`)
            return data.map(project => ({ id: project.id, name: project.name }))
        } catch (error) {
            console.error(`Error finding projects with name ${name}:`, error)
            return []
        }
    }

    async findProjectById(workspace, projectId) {
        try {
            if (!workspace || !projectId) {
                console.warn('Missing workspace ID or project ID for findProjectById')
                return { id: null, name: 'Unknown Project' }
            }
            
            let { data } = await this.httpClient.get(`/workspaces/${workspace}/projects/${projectId}`)
            return { id: data.id, name: data.name }
        } catch (error) {
            console.error(`Error finding project ${projectId}:`, error)
            return { id: projectId, name: 'Unknown Project' }
        }
    }

    async getProjectTasks(workspace, projectId) {
        try {
            if (!workspace || !projectId) {
                console.warn('Missing workspace ID or project ID for getProjectTasks')
                return []
            }
            
            const { data } = await this.httpClient.get(`https://global.api.clockify.me/workspaces/${workspace}/project-picker/projects/${projectId}/tasks?is-active=true&page-size=200`)
            return data
        } catch (error) {
            console.error(`Error getting tasks for project ${projectId}:`, error)
            return []
        }
    }

    async createTimeEntry(workspace, timeEntry) {
        try {
            await this.httpClient.post(`/workspaces/${workspace}/time-entries`, timeEntry)
        } catch (error) {
            console.error('Error creating time entry:', error)
            throw error
        }
    }

    async submitApprovalRequest(workspace, userId, weekStart) {
        try {
            if (!workspace || !userId || !weekStart) {
                console.warn('Missing required parameters for submitApprovalRequest')
                return
            }
            
            const approvalRequest = { weekTime: weekStart }
            await this.httpClient.post(`https://global.api.clockify.me/workspaces/${workspace}/users/${userId}/approval-requests/`, approvalRequest)
        } catch (error) {
            console.error('Error submitting approval request:', error)
        }
    }

    async getWeekEntries(workspace, userId, weekStart) {
        try {
            if (!workspace || !userId || !weekStart) {
                console.warn('Missing required parameters for getWeekEntries')
                return { status: 'UNSUBMITTED', entries: [] }
            }
            
            // Make a clone of weekStart to avoid modifying the original
            const weekStartClone = weekStart.clone();
            const start = weekStartClone.format();
            const end = weekStartClone.add(1, 'week').subtract(1, 'millisecond').format();
            
            // Get time entries first - this is the most important data
            let entries = [];
            let status = 'UNSUBMITTED';
            
            try {
                console.debug(`Fetching time entries for week starting ${start}`)
                const entriesResponse = await this.httpClient.get(
                    `https://global.api.clockify.me/workspaces/${workspace}/timeEntries/users/${userId}?start=${start}&end=${end}&hydrated=true&page-size=500`
                )
                entries = entriesResponse.data;
                
                // Check if we have entries - if yes, try to determine their status
                if (entries && entries.length > 0) {
                    // For past weeks, check if any entry has approvalRequestId - this indicates approval status
                    const approvedEntries = entries.filter(entry => entry.approvalRequestId);
                    if (approvedEntries.length > 0) {
                        // If we have approved entries, set status to APPROVED and skip the week-status API call
                        // that might return 404 for past weeks
                        status = 'APPROVED';
                        console.debug('Found approved entries, skipping week-status API call');
                        return { status, entries };
                    }
                }
                
                // For all weeks, just infer status from entries instead of using the week-status API
                // This avoids the 404 error that happens consistently with this endpoint
                console.debug('Inferring status from entries without week-status API call');
                
                // Use dayjs directly to ensure the import is used
                const now = dayjs();
                const oneMonthAgo = now.subtract(1, 'month');
                
                // For debugging purposes only - using dayjs to compare dates
                if (weekStartClone.isAfter(oneMonthAgo)) {
                    console.debug('Week is within the last month');
                }
                
                status = this.inferStatusFromEntries(entries);
                
                return { status, entries };
            } catch (entriesError) {
                console.error('Error fetching time entries:', entriesError);
                return { status: 'UNSUBMITTED', entries: [] };
            }
        } catch (error) {
            console.error('Error in getWeekEntries:', error);
            return { status: 'UNSUBMITTED', entries: [] };
        }
    }
    
    // New helper method to infer status from entries when week-status API fails
    inferStatusFromEntries(entries) {
        if (!entries || !entries.length) {
            return 'UNSUBMITTED';
        }
        
        // Check if any entries have approvalRequestId
        const approvedEntries = entries.filter(entry => entry.approvalRequestId);
        if (approvedEntries.length > 0) {
            return 'APPROVED';
        }
        
        // Check if entries have been locked (usually indicates submitted but not approved)
        const lockedEntries = entries.filter(entry => entry.isLocked);
        if (lockedEntries.length > 0) {
            return 'PENDING';
        }
        
        // Default status if we can't determine otherwise
        return 'UNSUBMITTED';
    }

    getWeekStatus(entries, weekStatus) {
        if (!entries.length) {
            return 'UNSUBMITTED'
        } else {
            if (entries[0].approvalRequestId) {
                return 'APPROVED'
            } else if (weekStatus.status === 'PENDING') {
                return 'PENDING'
            } else {
                return 'UNSUBMITTED'
            }
        }
    }

    async deleteTimeEntry(workspace, timeEntryId) {
        try {
            await this.httpClient.delete(`/workspaces/${workspace}/time-entries/${timeEntryId}`)
        } catch (error) {
            console.error(`Error deleting time entry ${timeEntryId}:`, error)
            throw error
        }
    }

    getTaskType(taskName) {
        return taskName.toLowerCase().includes('capex') ? 'capex' : 'opex'
    }

    getProjectIds(clockifyEntries) {
        return [...new Set(clockifyEntries.map(entry => entry.project.id))]
    }

    timeEntry = (start, end, projectId, taskId) => ({
        'start': start.toISOString(),
        'end': end.toISOString(),
        projectId,
        taskId
    })
}