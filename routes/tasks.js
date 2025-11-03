const Task = require('../models/task');
const User = require('../models/user');

module.exports = function (router) {
    const tasksRoute = router.route('/tasks');
    const tasksIdRoute = router.route('/tasks/:id');
    tasksRoute.get(async (req, res) => {
      try {
        const tasks = await Task.find();
        res.status(200).json({message: 'OK',data: tasks});
      } catch (err) {
        res.status(500).json({ message: 'Server error', data: err });
      }
    })

    tasksRoute.post(async (req, res) => {
      try {
        const task = new Task(req.body);


        if (task.assignedUser) {
          const user = await User.findById(task.assignedUser);
          if (!user) {
            return res.status(400).json({ message: 'Assigned user not found' });
          }

          user.pendingTasks.push(task._id);
          await user.save();
        }

        await task.save();
        res.status(201).json({message: 'OK',data: task});
      } catch (err) {
        res.status(500).json({ message: 'Server error', data: err });
      }
    });

    tasksIdRoute.get(async (req, res) => {
      try {
        const task = await Task.findById(req.params.id);
        if (!task) {
          return res.status(404).json({ message: 'Task not found' });
        }
        res.status(200).json({message: 'OK',data: task});
      } catch (err) {
        res.status(500).json({ message: 'Server error', data: err });
      }
    })

    tasksIdRoute.put(async (req, res) => {
    try {
      const taskId = req.params.id;


      const task = await Task.findById(taskId);
      if (!task) return res.status(404).json({ message: 'Task not found' });

      const oldAssignedUserId = task.assignedUser; 

      const {
        name,
        description,
        deadline,
        completed,
        assignedUser,
        assignedUserName
      } = req.body;


      if (assignedUser && assignedUser !== oldAssignedUserId) {

        if (oldAssignedUserId) {
          const oldUser = await User.findById(oldAssignedUserId);
          if (oldUser) {
            oldUser.pendingTasks = oldUser.pendingTasks.filter(
              id => id.toString() !== taskId.toString()
            );
            await oldUser.save();
          }
        }


        const newUser = await User.findById(assignedUser);
        if (!newUser) {
          return res.status(400).json({ message: 'New assigned user not found' });
        }
        if (!newUser.pendingTasks.includes(task._id)) {
          newUser.pendingTasks.push(task._id);
          await newUser.save();
        }

        task.assignedUser = assignedUser;
        task.assignedUserName = assignedUserName || newUser.name;
      }


      if (name !== undefined) task.name = name;
      if (description !== undefined) task.description = description;
      if (deadline !== undefined) task.deadline = deadline;
      if (completed !== undefined) task.completed = completed;


      await task.save();

      res.status(200).json({message: 'OK', data: task});

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error', data: err });
    }
  });

    tasksIdRoute.delete(async (req, res) => {
        try {
        const taskId = req.params.id;

        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        if (task.assignedUser) {
            const user = await User.findById(task.assignedUser);
            if (user) {
            user.pendingTasks = user.pendingTasks.filter(
                id => id.toString() !== taskId.toString()
            );
            await user.save();
            }
        }

        await Task.findByIdAndDelete(taskId);

        res.status(204).send();

        } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', data: err });
        }
    });

  return router;
};