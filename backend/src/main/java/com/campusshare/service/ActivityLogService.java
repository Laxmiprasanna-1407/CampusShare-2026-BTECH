package com.campusshare.service;

import com.campusshare.model.ActivityLog;
import com.campusshare.repository.ActivityLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class ActivityLogService {

    private static final Logger log = LoggerFactory.getLogger(ActivityLogService.class);
    private final ActivityLogRepository activityLogRepository;

    public ActivityLogService(ActivityLogRepository activityLogRepository) {
        this.activityLogRepository = activityLogRepository;
    }

    @Async
    public void logActivity(String email, String action, String details) {
        try {
            ActivityLog logEntry = new ActivityLog(email, action, details);
            activityLogRepository.save(logEntry);
            log.info("Activity logged: [{}] {} - {}", email != null ? email : "SYSTEM", action, details);
        } catch (Exception ex) {
            log.error("Failed to write activity log entry: {}", ex.getMessage());
        }
    }
}
