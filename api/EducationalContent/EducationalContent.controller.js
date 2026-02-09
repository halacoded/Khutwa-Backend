const EducationalContent = require("../../models/EducationalContent");
const User = require("../../models/User");

// ============================
// CREATE EDUCATIONAL CONTENT
// ============================
exports.createContent = async (req, res, next) => {
  try {
    const { title, description, content, contentType, category } = req.body;
    const createdBy = req.user.id;

    // Validate required fields
    if (!title || !description || !content) {
      return res.status(400).json({
        message: "Title, description, and content are required",
      });
    }

    // Check if user is admin
    const user = await User.findById(createdBy);
    if (!user.isAdmin) {
      return res.status(403).json({
        message: "Only admins can create educational content",
      });
    }

    // Handle photo upload if exists
    let photo = "";
    if (req.files && req.files.photo) {
      photo = req.files.photo[0].filename;
    }

    // Create new educational content
    const educationalContent = new EducationalContent({
      title,
      description,
      content,
      contentType: contentType || "article",
      category: category || "prevention",
      photo,
      createdBy,
    });

    await educationalContent.save();

    // Populate createdBy field
    await educationalContent.populate("createdBy", "name email");

    res.status(201).json({
      message: "Educational content created successfully",
      content: educationalContent,
    });
  } catch (error) {
    console.error("Create content error:", error);
    res.status(500).json({
      message: "Error creating educational content",
      error: error.message,
    });
  }
};

// ============================
// GET ALL EDUCATIONAL CONTENT
// ============================
exports.getAllContent = async (req, res, next) => {
  try {
    const {
      category,
      contentType,
      search,
      sort = "createdAt",
      order = "desc",
      limit = 20,
      page = 1,
    } = req.query;

    // Build query
    let query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by content type
    if (contentType) {
      query.contentType = contentType;
    }

    // Search in title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort
    const sortOptions = {};
    sortOptions[sort] = order === "asc" ? 1 : -1;

    // Get total count for pagination
    const total = await EducationalContent.countDocuments(query);

    // Get content with pagination and sorting
    const content = await EducationalContent.find(query)
      .populate("createdBy", "name email")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      message: "Educational content retrieved successfully",
      content,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get all content error:", error);
    res.status(500).json({
      message: "Error retrieving educational content",
      error: error.message,
    });
  }
};

// ============================
// GET SINGLE EDUCATIONAL CONTENT (with view increment)
// ============================
exports.getContentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find content and increment views
    const content = await EducationalContent.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } }, // Increment views by 1
      { new: true }, // Return updated document
    ).populate("createdBy", "name email");

    if (!content) {
      return res.status(404).json({
        message: "Educational content not found",
      });
    }

    res.status(200).json({
      message: "Educational content retrieved successfully",
      content,
    });
  } catch (error) {
    console.error("Get content by ID error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid content ID format",
      });
    }

    res.status(500).json({
      message: "Error retrieving educational content",
      error: error.message,
    });
  }
};

// ============================
// UPDATE EDUCATIONAL CONTENT
// ============================
exports.updateContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;

    // Check if user is admin
    const user = await User.findById(userId);
    if (!user.isAdmin) {
      return res.status(403).json({
        message: "Only admins can update educational content",
      });
    }

    // Find content
    const content = await EducationalContent.findById(id);
    if (!content) {
      return res.status(404).json({
        message: "Educational content not found",
      });
    }

    // Handle photo update if exists
    if (req.files && req.files.photo) {
      updates.photo = req.files.photo[0].filename;
      // Note: In production, you might want to delete old photo file
    }

    // Update content
    Object.assign(content, updates);
    await content.save();

    // Populate createdBy field
    await content.populate("createdBy", "name email");

    res.status(200).json({
      message: "Educational content updated successfully",
      content,
    });
  } catch (error) {
    console.error("Update content error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid content ID format",
      });
    }

    res.status(500).json({
      message: "Error updating educational content",
      error: error.message,
    });
  }
};

// ============================
// DELETE EDUCATIONAL CONTENT
// ============================
exports.deleteContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is admin
    const user = await User.findById(userId);
    if (!user.isAdmin) {
      return res.status(403).json({
        message: "Only admins can delete educational content",
      });
    }

    // Find and delete content
    const content = await EducationalContent.findByIdAndDelete(id);

    if (!content) {
      return res.status(404).json({
        message: "Educational content not found",
      });
    }

    res.status(200).json({
      message: "Educational content deleted successfully",
      contentId: id,
    });
  } catch (error) {
    console.error("Delete content error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid content ID format",
      });
    }

    res.status(500).json({
      message: "Error deleting educational content",
      error: error.message,
    });
  }
};

// ============================
// GET CONTENT STATISTICS (Admin only)
// ============================
exports.getContentStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check if user is admin
    const user = await User.findById(userId);
    if (!user.isAdmin) {
      return res.status(403).json({
        message: "Only admins can view content statistics",
      });
    }

    // Get total content count
    const totalContent = await EducationalContent.countDocuments();

    // Get content by category
    const contentByCategory = await EducationalContent.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalViews: { $sum: "$views" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get content by type
    const contentByType = await EducationalContent.aggregate([
      {
        $group: {
          _id: "$contentType",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get most viewed content
    const mostViewed = await EducationalContent.find()
      .sort({ views: -1 })
      .limit(5)
      .select("title views category contentType");

    // Get recent content
    const recentContent = await EducationalContent.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title createdAt category");

    res.status(200).json({
      message: "Content statistics retrieved successfully",
      stats: {
        totalContent,
        contentByCategory,
        contentByType,
        mostViewed,
        recentContent,
      },
    });
  } catch (error) {
    console.error("Get content stats error:", error);
    res.status(500).json({
      message: "Error retrieving content statistics",
      error: error.message,
    });
  }
};

// ============================
// GET CONTENT BY CATEGORY
// ============================
exports.getContentByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;

    // Validate category
    const validCategories = [
      "prevention",
      "foot_care",
      "nutrition",
      "exercise",
      "monitoring",
      "emergency",
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        message: "Invalid category",
        validCategories,
      });
    }

    const content = await EducationalContent.find({ category })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: `Educational content in ${category} category retrieved`,
      category,
      count: content.length,
      content,
    });
  } catch (error) {
    console.error("Get content by category error:", error);
    res.status(500).json({
      message: "Error retrieving content by category",
      error: error.message,
    });
  }
};
