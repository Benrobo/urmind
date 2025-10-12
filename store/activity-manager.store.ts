import { StorageStore } from "@/helpers/storage-store";
import shortId from "short-uuid";
import logger from "@/lib/logger";
import dayjs from "dayjs";
import { sleep } from "@/lib/utils";

export type ActivityStatus = "pending" | "in-progress" | "completed" | "failed";

export type Activity = {
  id: string;
  title: string;
  status: ActivityStatus;
  description?: string;
  createdAt: number;
  updatedAt?: number;
};

// Store for managing activities processors throughout the extension
export class ActivityManagerStore extends StorageStore<{
  activities: Activity[];
}> {
  constructor() {
    super("local:activity_manager_state", {
      activities: [],
    });
  }

  /**
   * Track a new activity
   */
  async track(activity: Omit<Activity, "id" | "createdAt">): Promise<string> {
    const id = shortId.generate();
    const newActivity: Activity = {
      id,
      createdAt: Date.now(),
      ...activity,
    };

    const currentState = await this.get();
    const updatedActivities = [...currentState.activities, newActivity];

    await this.set({ activities: updatedActivities });

    logger.info(`📝 Activity tracked: ${newActivity.title} (${id})`);
    return id;
  }

  /**
   * Update an existing activity
   */
  async updateActivity(
    id: string,
    updates: Partial<Omit<Activity, "id" | "createdAt">>
  ): Promise<boolean> {
    const currentState = await this.get();
    const activityIndex = currentState.activities.findIndex((a) => a.id === id);

    if (activityIndex === -1) {
      logger.warn(`⚠️ Activity not found: ${id}`);
      return false;
    }

    const updatedActivities = [...currentState.activities];
    updatedActivities[activityIndex] = {
      ...updatedActivities[activityIndex],
      ...updates,
      updatedAt: Date.now(),
    } as Activity;

    await this.set({ activities: updatedActivities });

    logger.info(`📝 Activity updated: ${id}`, updates);
    return true;
  }

  /**
   * Delete an activity from the store
   */
  async delete(id: string): Promise<boolean> {
    const currentState = await this.get();
    const updatedActivities = currentState.activities.filter(
      (a) => a.id !== id
    );

    if (updatedActivities.length === currentState.activities.length) {
      logger.warn(`⚠️ Activity not found for deletion: ${id}`);
      return false;
    }

    await this.set({ activities: updatedActivities });

    logger.info(`🗑️ Activity deleted: ${id}`);
    return true;
  }

  /**
   * Get all activities sorted by creation date (most recent first)
   */
  async getActivities(): Promise<Activity[]> {
    const currentState = await this.get();
    return currentState.activities.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Clear all activities
   */
  async clearActivities(): Promise<void> {
    await this.set({ activities: [] });
    logger.info("🧹 All activities cleared");
  }

  /**
   * Clean up old activities (older than 1 minute and completed/failed)
   */
  async cleanupOldActivities(): Promise<void> {
    const currentState = await this.get();
    const now = dayjs();
    const xMinuteAgo = now.subtract(1, "minute");

    let cleanedCount = 0;

    // Process activities one by one
    for (const activity of currentState.activities) {
      const activityTime = dayjs(activity.createdAt);
      const isOlderThanXMinute = activityTime.isBefore(xMinuteAgo);
      const isCompleted =
        activity.status === "completed" || activity.status === "failed";

      if (activity.status === "failed") {
        // wait 1 minute before deleting
        await sleep(1000 * 60);
      }

      if (isOlderThanXMinute && isCompleted) {
        const success = await this.delete(activity.id);
        if (success) {
          cleanedCount++;
        }
      }
    }

    if (cleanedCount > 0) {
      logger.info(`🧹 Cleaned up ${cleanedCount} old activities`);
    }
  }
}

export const activityManagerStore = new ActivityManagerStore();
