import { Response } from 'express';
import File from '../models/File.model';
import User from '../models/User.model';
import ActivityLog from '../models/ActivityLog.model';
import { AuthRequest } from '../middleware/auth.middleware';

// @desc    Get dashboard statistics
// @route   GET /api/stats/dashboard
// @access  Private (Superadmin only)
export const getDashboardStats = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        // Total files
        const totalFiles = await File.countDocuments();

        // Total responsables
        const totalResponsables = await User.countDocuments({ role: 'responsable' });

        // Files uploaded this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const filesThisMonth = await File.countDocuments({
            createdAt: { $gte: startOfMonth },
        });

        // Total storage used (sum of all file sizes)
        const storageResult = await File.aggregate([
            {
                $group: {
                    _id: null,
                    totalSize: { $sum: '$fileSize' },
                },
            },
        ]);

        const totalStorage = storageResult.length > 0 ? storageResult[0].totalSize : 0;

        // Recent uploads (last 10)
        const recentUploads = await File.find()
            .populate('uploadedBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            stats: {
                totalFiles,
                totalResponsables,
                filesThisMonth,
                totalStorage,
                recentUploads,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics',
            error: error.message,
        });
    }
};

// @desc    Get files distribution by filiere
// @route   GET /api/stats/files-by-filiere
// @access  Private (Superadmin only)
export const getFilesByFiliere = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const distribution = await File.aggregate([
            {
                $group: {
                    _id: '$filiere',
                    count: { $sum: 1 },
                    totalSize: { $sum: '$fileSize' },
                },
            },
            {
                $sort: { count: -1 },
            },
        ]);

        res.status(200).json({
            success: true,
            distribution,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error fetching files distribution',
            error: error.message,
        });
    }
};

// @desc    Get files distribution by year
// @route   GET /api/stats/files-by-year
// @access  Private (Superadmin only)
export const getFilesByYear = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const distribution = await File.aggregate([
            {
                $group: {
                    _id: '$year',
                    count: { $sum: 1 },
                    totalSize: { $sum: '$fileSize' },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);

        res.status(200).json({
            success: true,
            distribution,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error fetching files distribution by year',
            error: error.message,
        });
    }
};

// @desc    Get activity logs
// @route   GET /api/stats/logs
// @access  Private (Superadmin only)
export const getActivityLogs = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { page = 1, limit = 50 } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const logs = await ActivityLog.find()
            .populate('userId', 'firstName lastName email')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await ActivityLog.countDocuments();

        res.status(200).json({
            success: true,
            count: logs.length,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            logs,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error fetching activity logs',
            error: error.message,
        });
    }
};
