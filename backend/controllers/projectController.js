import prisma from "../prismaClient.js";

/**
 * Create a new project.
 * POST /api/projects
 * Body: { name, description }
 */
export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ message: "Project name is required." });
    }

    // Create project and assign owner as ADMIN member in a transaction
    const project = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          name,
          description,
          ownerId: userId,
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: newProject.id,
          userId: userId,
          role: "ADMIN",
        },
      });

      return newProject;
    });

    res.status(201).json({
      message: "Project created successfully.",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * Fetch all projects where the user is an owner or a member.
 * GET /api/projects
 */
export const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch projects where user is either the owner or a member
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({ projects });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * Add a member to a project.
 * POST /api/projects/:id/members
 * Body: { email, role }
 */
export const addProjectMember = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { email, role } = req.body;
    const currentUserId = req.user.id;

    if (!email) {
      return res.status(400).json({ message: "User email is required." });
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    // Check if current user is ADMIN in this project or is the owner
    const isOwner = project.ownerId === currentUserId;
    const isCurrentAdmin = project.members.some(
      (m) => m.userId === currentUserId && m.role === "ADMIN"
    );

    if (!isOwner && !isCurrentAdmin) {
      return res.status(403).json({ message: "Only project admins can add members." });
    }

    // Find the user to add
    const userToAdd = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToAdd) {
      return res.status(404).json({ message: "User not found with this email." });
    }

    // Check if user is already a member
    const existingMember = project.members.find((m) => m.userId === userToAdd.id);
    if (existingMember) {
      return res.status(409).json({ message: "User is already a member of this project." });
    }

    // Add member
    const newMember = await prisma.projectMember.create({
      data: {
        projectId,
        userId: userToAdd.id,
        role: role === "ADMIN" ? "ADMIN" : "MEMBER",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Create a notification for the added user
    await prisma.notification.create({
      data: {
        userId: userToAdd.id,
        type: "PROJECT_INVITE",
        message: `You have been added to the project "${project.name}" as a ${newMember.role}.`,
      },
    });

    res.status(201).json({
      message: "Member added successfully.",
      member: newMember,
    });
  } catch (error) {
    console.error("Add project member error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
