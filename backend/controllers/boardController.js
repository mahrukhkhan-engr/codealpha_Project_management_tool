import prisma from "../prismaClient.js";

/**
 * Create a new board column inside a project.
 * POST /api/boards
 * Body: { name, projectId, position }
 */
export const createBoard = async (req, res) => {
  try {
    const { name, projectId, position } = req.body;
    const userId = req.user.id;

    if (!name || !projectId) {
      return res.status(400).json({ message: "Board name and projectId are required." });
    }

    // Verify project exists and user is a member/owner
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    if (!projectMember && project.ownerId !== userId) {
      return res.status(403).json({ message: "Access denied. You are not a member of this project." });
    }

    // Determine position if not provided (find max position and add 1)
    let boardPosition = position;
    if (boardPosition === undefined) {
      const lastBoard = await prisma.board.findFirst({
        where: { projectId },
        orderBy: { position: "desc" },
      });
      boardPosition = lastBoard ? lastBoard.position + 1 : 0;
    }

    // Create board
    const board = await prisma.board.create({
      data: {
        name,
        projectId,
        position: boardPosition,
      },
    });

    res.status(201).json({
      message: "Board created successfully.",
      board,
    });
  } catch (error) {
    console.error("Create board error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * Fetch all boards for a specific project with their tasks.
 * GET /api/boards/project/:projectId
 */
export const getProjectBoards = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Verify project exists and user is a member/owner
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    if (!projectMember && project.ownerId !== userId) {
      return res.status(403).json({ message: "Access denied. You are not a member of this project." });
    }

    // Fetch boards with tasks sorted by position
    const boards = await prisma.board.findMany({
      where: { projectId },
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            position: "asc",
          },
        },
      },
      orderBy: {
        position: "asc",
      },
    });

    res.status(200).json({ boards });
  } catch (error) {
    console.error("Get project boards error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
