import { mapMutations } from 'vuex'
import { mapFields } from 'vuex-map-fields'

import { isProfileTask, findDayOffTask, getAllTimesheetTaskIds } from '@/helpers/timesheet-helpers'

export default {
    data() {
        return {
            distributionProfile: null
        }
    },
    computed: {
        ...mapFields([
            'projects',
            'userInfo',
            'profile',
            'timeEntries'
        ]),
        workspace: function () {
            return this.userInfo?.activeWorkspace || null
        },
        projectsCount: function () {
            return this.projects?.length || 0
        },
        profileProjects: function () {
            if (!this.projects || !this.distributionProfile) {
                return this.projects || []
            }
            
            return this.projects.map(project => ({
                ...project,
                tasks: project.tasks?.filter(task => isProfileTask(task, this.distributionProfile)) || []
            }))
        },
        profileProjectsPlusTimeOff: function () {
            // Defensive coding to prevent TypeError if projects or distributionProfile is undefined
            if (!this.projects || !Array.isArray(this.projects)) {
                return []
            }
            
            const dayOffTask = findDayOffTask(this.projects) || { id: null }
            
            return this.projects.map(project => {
                // Make sure project.tasks exists and is an array
                if (!project.tasks || !Array.isArray(project.tasks)) {
                    return { ...project, tasks: [] }
                }
                
                return {
                    ...project,
                    tasks: project.tasks.filter(task => 
                        // If distributionProfile is undefined, just check for day off task
                        (this.distributionProfile && isProfileTask(task, this.distributionProfile)) ||
                        (dayOffTask && task.id === dayOffTask.id)
                    )
                }
            })
        },
        projectIds: function () {
            return this.projects.map(project => project.id)
        },
        allTasks: function () {
            return this.projects.flatMap(project => project.tasks)
        },
        allTaskIds: function () {
            return this.projects.flatMap(project => project.tasks).map(task => task.id)
        }
    },
    created() {
        // Try to initialize the distribution profile from the current profile
        try {
            if (this.profile) {
                this.distributionProfile = this.$profileService?.getDistributionProfile(this.profile);
                
                if (!this.distributionProfile) {
                    console.warn('Unable to get distribution profile for:', this.profile);
                }
            }
        } catch (error) {
            console.error('Error initializing distribution profile:', error);
        }
        
        // Set up a watcher to update distributionProfile when profile changes
        this.$watch('profile', (newProfile) => {
            try {
                if (newProfile) {
                    this.distributionProfile = this.$profileService?.getDistributionProfile(newProfile);
                } else {
                    this.distributionProfile = null;
                }
            } catch (error) {
                console.error('Error updating distribution profile:', error);
                this.distributionProfile = null;
            }
        });
    },
    methods: {
        ...mapMutations([
            'addProject',
            'removeProject'
        ]),
        getTaskProjectId(taskId) {
            const [ projectId ] = this.projects
                .filter(project => project.tasks.filter(task => task.id === taskId).length)
                .map(project => project.id)
            return projectId
        },
        async addBAUProject() {
          const [ bauProject ] = await this.$clockify.findProjectsByName(this.workspace, "BAU Placeholder")
          bauProject.unremovable = true
          bauProject.name = "BAU Placeholder"
          this.addProjectToMyProjects(bauProject)
        },
        async addProjectToMyProjects(project) {
          const tasks = (await this.$clockify.getProjectTasks(this.workspace, project.id)).map(task => ({
            id: task.id,
            name: task.name,
            type: this.$clockify.getTaskType(task.name)
          }))
          project.tasks = tasks
          this.addProject(project)
          this.$bugsnag.leaveBreadcrumb('Project added', { project })
        },
        async removeProjectFromMyProjects(project) {
            if (this.hasProjectAnyTimeEntries(project)) {
                this.openSnackbar(`Project cannot be removed as time entries have been reported for it`, 'is-danger')
                return
            }
            this.$bugsnag.leaveBreadcrumb('Project removed', { project })
            this.removeProject(project)
        },
        hasProjectAnyTimeEntries(project) {
            const projectTaskIds = project.tasks.map(task => task.id)
            const timesheetTaskIds = getAllTimesheetTaskIds(this.timeEntries)
            return projectTaskIds.filter(x => timesheetTaskIds.includes(x)).length > 0
        }
    }
}