import prisma from "../prismaClient.js";

/**
 * Create a task card inside a specific board.
 * POST /api/tasks
 * Body: { title, description, priority, boardId, assigneeId, dueDate, position }
 */
export const createTask = async (req, res) => {
  try {
    const { title, description, priority, boardId, assigneeId, dueDate, position } = req.body;
    const userId = req.user.id;

    if (!title || !boardId) {
      return res.status(400).json({ message: "Task title and boardId are required." });
    }

    // Verify board exists and get its project
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        project: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!board) {
      return res.status(404).json({ message: "Board not found." });
    }

    // Check project membership
    const isOwner = board.project.ownerId === userId;
    const isMember = board.project.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: "Access denied. You are not a member of this project." });
    }

    // Determine position if not provided
    let taskPosition = position;
    if (taskPosition === undefined) {
      const lastTask = await prisma.task.findFirst({
        where: { boardId },
        orderBy: { position: "desc" },
      });
      taskPosition = lastTask ? lastTask.position + 1 : 0;
    }

    // Validate assignee if provided
    if (assigneeId) {
      const assigneeMember = board.project.members.some((m) => m.userId === assigneeId);
      const isAssigneeOwner = board.project.ownerId === assigneeId;
      if (!assigneeMember && !isAssigneeOwner) {
        return res.status(400).json({ message: "Assignee is not a member of this project." });
      }
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || "MEDIUM",
        status: "TODO",
        position: taskPosition,
        boardId,
        assigneeId: assigneeId || null,
        creatorId: userId,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
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
    });

    // Notify assignee if assigned to someone else
    if (assigneeId && assigneeId !== userId) {
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          type: "TASK_ASSIGNED",
          message: `You have been assigned to the task "${title}" in project "${board.project.name}".`,
        },
      });
    }

    res.status(201).json({
      message: "Task created successfully.",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * Update task details (title, description, priority, boardId, status, position, assigneeId, dueDate).
 * PUT /api/tasks/:id
 */
export const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, description, priority, status, boardId, position, assigneeId, dueDate } = req.body;
    const userId = req.user.id;

    // Find the current task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        board: {
          include: {
            project: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    const project = task.board.project;
    const isOwner = project.ownerId === userId;
    const isMember = project.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: "Access denied. You are not a member of this project." });
    }

    // Build update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (position !== undefined) updateData.position = position;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    // Validate and update board if changed
    if (boardId !== undefined && boardId !== task.boardId) {
      const targetBoard = await prisma.board.findUnique({
        where: { id: boardId },
      });
      if (!targetBoard || targetBoard.projectId !== project.id) {
        return res.status(400).json({ message: "Invalid target board." });
      }
      updateData.boardId = boardId;
    }

    // Validate and update assignee if changed
    if (assigneeId !== undefined && assigneeId !== task.assigneeId) {
      if (assigneeId) {
        const assigneeMember = project.members.some((m) => m.userId === assigneeId);
        const isAssigneeOwner = project.ownerId === assigneeId;
        if (!assigneeMember && !isAssigneeOwner) {
          return res.status(400).json({ message: "Assignee is not a member of this project." });
        }
        updateData.assigneeId = assigneeId;
      } else {
        updateData.assigneeId = null;
      }
    }

    // Perform update
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
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
    });

    // Notify assignee if a new assignee is set
    if (assigneeId && assigneeId !== task.assigneeId && assigneeId !== userId) {
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          type: "TASK_ASSIGNED",
          message: `You have been assigned to the task "${updatedTask.title}" in project "${project.name}".`,
        },
      });
    }

    res.status(200).json({
      message: "Task updated successfully.",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
