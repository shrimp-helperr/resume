class ResumeApp {
  constructor() {
    this.data = this.loadData() || this.getDefaultData();
    this.init();
  }

  getDefaultData() {
    return {
      basic: {
        name: '',
        gender: '',
        political: '',
        hometown: '',
        jobTarget: '',
        birthDate: '',
        email: '',
        phone: '',
        avatar: ''
      },
      education: [],
      projects: [],
      campus: [],
      skills: []
    };
  }

  init() {
    this.bindEvents();
    this.renderAll();
    this.startAutoSave();
  }

  bindEvents() {
    document.getElementById('menuToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('show');
    });

    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        this.switchSection(section);
      });
    });

    document.querySelectorAll('#basic input, #basic select').forEach(input => {
      input.addEventListener('input', (e) => {
        const field = e.target.dataset.field;
        if (field) {
          this.data.basic[field] = e.target.value;
          if (field === 'name' || field === 'jobTarget') {
            this.updateNavInfo();
          }
          this.markUnsaved();
        }
      });
    });

    document.getElementById('avatarUpload').addEventListener('click', () => {
      document.getElementById('avatarInput').click();
    });

    document.getElementById('avatarInput').addEventListener('change', (e) => {
      this.handleAvatarUpload(e);
    });

    document.getElementById('exportPdfBtn').addEventListener('click', () => {
      this.exportPDF();
    });

    document.getElementById('addEducationBtn').addEventListener('click', () => {
      this.addEducation();
    });

    document.getElementById('addProjectBtn').addEventListener('click', () => {
      this.addProject();
    });

    document.getElementById('addCampusBtn').addEventListener('click', () => {
      this.addCampus();
    });

    document.getElementById('addSkillCategoryBtn').addEventListener('click', () => {
      this.addSkillCategory();
    });
  }

  switchSection(section) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.section === section);
    });

    document.querySelectorAll('.section').forEach(sec => {
      sec.classList.toggle('active', sec.id === section);
    });

    if (window.innerWidth < 1024) {
      document.getElementById('sidebar').classList.remove('show');
    }
  }

  handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.data.basic.avatar = e.target.result;
      this.renderAvatar();
      this.markUnsaved();
    };
    reader.readAsDataURL(file);
  }

  renderAvatar() {
    const preview = document.getElementById('avatarPreview');
    const navAvatar = document.getElementById('navAvatar');
    
    if (this.data.basic.avatar) {
      preview.innerHTML = `<img src="${this.data.basic.avatar}" alt="头像">`;
      navAvatar.innerHTML = `<img src="${this.data.basic.avatar}" class="w-full h-full object-cover" alt="头像">`;
    } else {
      preview.innerHTML = '<i class="fas fa-camera"></i>';
      navAvatar.innerHTML = '<i class="fas fa-user text-blue-600"></i>';
    }
  }

  updateNavInfo() {
    document.getElementById('navUserName').textContent = this.data.basic.name || '未填写姓名';
    document.getElementById('navUserTitle').textContent = this.data.basic.jobTarget || '未填写求职意向';
  }

  addEducation() {
    this.data.education.unshift({
      id: Date.now(),
      startDate: '',
      endDate: '',
      school: '',
      major: '',
      degree: '',
      gpa: '',
      ranking: '',
      courses: '',
      honors: []
    });
    this.renderEducation();
    this.markUnsaved();
  }

  removeEducation(id) {
    this.data.education = this.data.education.filter(e => e.id !== id);
    this.renderEducation();
    this.markUnsaved();
  }

  updateEducation(id, field, value) {
    const edu = this.data.education.find(e => e.id === id);
    if (edu) {
      edu[field] = value;
      this.markUnsaved();
    }
  }

  addHonor(eduId) {
    const edu = this.data.education.find(e => e.id === eduId);
    if (edu) {
      if (!edu.honors) edu.honors = [];
      edu.honors.push({ id: Date.now(), text: '' });
      this.renderEducation();
      this.markUnsaved();
    }
  }

  removeHonor(eduId, honorId) {
    const edu = this.data.education.find(e => e.id === eduId);
    if (edu && edu.honors) {
      edu.honors = edu.honors.filter(h => h.id !== honorId);
      this.renderEducation();
      this.markUnsaved();
    }
  }

  updateHonor(eduId, honorId, value) {
    const edu = this.data.education.find(e => e.id === eduId);
    if (edu && edu.honors) {
      const honor = edu.honors.find(h => h.id === honorId);
      if (honor) {
        honor.text = value;
        this.markUnsaved();
      }
    }
  }

  renderEducation() {
    const container = document.getElementById('educationList');
    if (!container) return;

    container.innerHTML = this.data.education.map(edu => `
      <div class="card p-5" data-edu-id="${edu.id}">
        <div class="flex items-start justify-between mb-4">
          <h3 class="font-semibold text-blue-900">教育经历</h3>
          <button class="btn-danger" data-action="remove-education" data-id="${edu.id}">
            <i class="fas fa-trash-alt"></i> 删除
          </button>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">开始时间</label>
            <input type="month" class="input-field" value="${edu.startDate || ''}" data-field="startDate" data-edu-id="${edu.id}">
          </div>
          <div>
            <label class="label">结束时间</label>
            <input type="month" class="input-field" value="${edu.endDate || ''}" data-field="endDate" data-edu-id="${edu.id}">
          </div>
          <div>
            <label class="label">学校名称</label>
            <input type="text" class="input-field" placeholder="学校名称" value="${edu.school || ''}" data-field="school" data-edu-id="${edu.id}">
          </div>
          <div>
            <label class="label">专业</label>
            <input type="text" class="input-field" placeholder="专业" value="${edu.major || ''}" data-field="major" data-edu-id="${edu.id}">
          </div>
          <div>
            <label class="label">学历</label>
            <select class="input-field" data-field="degree" data-edu-id="${edu.id}">
              <option value="">请选择</option>
              <option value="本科" ${edu.degree === '本科' ? 'selected' : ''}>本科</option>
              <option value="硕士" ${edu.degree === '硕士' ? 'selected' : ''}>硕士</option>
              <option value="博士" ${edu.degree === '博士' ? 'selected' : ''}>博士</option>
              <option value="大专" ${edu.degree === '大专' ? 'selected' : ''}>大专</option>
            </select>
          </div>
          <div>
            <label class="label">GPA</label>
            <input type="text" class="input-field" placeholder="如：3.8/4.0" value="${edu.gpa || ''}" data-field="gpa" data-edu-id="${edu.id}">
          </div>
          <div class="col-span-2">
            <label class="label">主修课程</label>
            <input type="text" class="input-field" placeholder="填写主修课程，用逗号分隔" value="${edu.courses || ''}" data-field="courses" data-edu-id="${edu.id}">
          </div>
          <div class="col-span-2">
            <div class="flex items-center justify-between mb-2">
              <label class="label mb-0">荣誉奖项</label>
              <button class="btn-secondary text-xs" data-action="add-honor" data-edu-id="${edu.id}">
                <i class="fas fa-plus"></i> 添加
              </button>
            </div>
            <div class="honors-container">
              ${(edu.honors || []).map(honor => `
                <div class="honor-item">
                  <i class="fas fa-trophy text-yellow-500"></i>
                  <input type="text" placeholder="输入荣誉奖项" value="${honor.text || ''}" data-honor-id="${honor.id}" data-edu-id="${edu.id}">
                  <button data-action="remove-honor" data-edu-id="${edu.id}" data-honor-id="${honor.id}">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `).join('');

    this.bindEducationEvents();
  }

  bindEducationEvents() {
    document.querySelectorAll('[data-action="remove-education"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.removeEducation(parseInt(btn.dataset.id));
      });
    });

    document.querySelectorAll('[data-edu-id] input, [data-edu-id] select').forEach(input => {
      if (!input.dataset.honorId) {
        input.addEventListener('change', () => {
          this.updateEducation(parseInt(input.dataset.eduId), input.dataset.field, input.value);
        });
      }
    });

    document.querySelectorAll('[data-action="add-honor"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.addHonor(parseInt(btn.dataset.eduId));
      });
    });

    document.querySelectorAll('[data-action="remove-honor"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.removeHonor(parseInt(btn.dataset.eduId), parseInt(btn.dataset.honorId));
      });
    });

    document.querySelectorAll('.honor-item input').forEach(input => {
      input.addEventListener('input', () => {
        this.updateHonor(parseInt(input.dataset.eduId), parseInt(input.dataset.honorId), input.value);
      });
    });
  }

  addProject() {
    this.data.projects.push({
      id: Date.now(),
      name: '新项目',
      role: '',
      startDate: '',
      endDate: '',
      techStack: '',
      description: '',
      achievements: '',
      files: [],
      expanded: true
    });
    this.renderProjects();
    this.markUnsaved();
  }

  removeProject(id) {
    this.data.projects = this.data.projects.filter(p => p.id !== id);
    this.renderProjects();
    this.markUnsaved();
  }

  updateProject(id, field, value) {
    const project = this.data.projects.find(p => p.id === id);
    if (project) {
      project[field] = value;
      this.markUnsaved();
    }
  }

  toggleProject(id) {
    const project = this.data.projects.find(p => p.id === id);
    if (project) {
      project.expanded = !project.expanded;
      this.renderProjects();
    }
  }

  handleProjectFileUpload(projectId, file) {
    if (file.size > 10 * 1024 * 1024) {
      this.showToast('文件大小不能超过10MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const project = this.data.projects.find(p => p.id === projectId);
      if (project) {
        if (!project.files) project.files = [];
        project.files.push({
          id: Date.now(),
          name: file.name,
          type: file.type,
          data: e.target.result
        });
        this.renderProjects();
        this.markUnsaved();
        this.showToast('文件上传成功');
      }
    };
    reader.readAsDataURL(file);
  }

  removeProjectFile(projectId, fileId) {
    const project = this.data.projects.find(p => p.id === projectId);
    if (project && project.files) {
      project.files = project.files.filter(f => f.id !== fileId);
      this.renderProjects();
      this.markUnsaved();
    }
  }

  renderProjects() {
    const container = document.getElementById('projectsList');
    const countEl = document.getElementById('projectCount');
    
    if (!container) return;
    
    countEl.textContent = this.data.projects.length;

    container.innerHTML = this.data.projects.map(project => `
      <div class="project-card" data-project-id="${project.id}">
        <div class="project-header" data-action="toggle-project" data-id="${project.id}">
          <div>
            <div class="project-title">${project.name || '未命名项目'}</div>
            <div class="project-time">${project.startDate || '未设置'} ~ ${project.endDate || '至今'}</div>
          </div>
          <div class="flex items-center gap-3">
            <button class="btn-danger btn-sm" data-action="remove-project" data-id="${project.id}">
              <i class="fas fa-trash-alt"></i>
            </button>
            <i class="fas fa-chevron-down expand-icon ${project.expanded ? 'rotated' : ''}"></i>
          </div>
        </div>
        <div class="project-body ${project.expanded ? 'expanded' : ''}">
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="label">项目名称</label>
              <input type="text" class="input-field" value="${project.name || ''}" data-field="name" data-project-id="${project.id}">
            </div>
            <div>
              <label class="label">担任角色</label>
              <input type="text" class="input-field" placeholder="如：前端负责人" value="${project.role || ''}" data-field="role" data-project-id="${project.id}">
            </div>
            <div>
              <label class="label">技术栈</label>
              <input type="text" class="input-field" placeholder="如：Vue, Node.js" value="${project.techStack || ''}" data-field="techStack" data-project-id="${project.id}">
            </div>
            <div>
              <label class="label">开始时间</label>
              <input type="month" class="input-field" value="${project.startDate || ''}" data-field="startDate" data-project-id="${project.id}">
            </div>
            <div>
              <label class="label">结束时间</label>
              <input type="month" class="input-field" value="${project.endDate || ''}" data-field="endDate" data-project-id="${project.id}">
            </div>
            <div class="col-span-2">
              <label class="label">项目描述</label>
              <textarea class="input-field" rows="3" placeholder="描述项目内容..." data-field="description" data-project-id="${project.id}">${project.description || ''}</textarea>
            </div>
            <div class="col-span-2">
              <label class="label">项目成果</label>
              <textarea class="input-field" rows="2" placeholder="描述项目成果..." data-field="achievements" data-project-id="${project.id}">${project.achievements || ''}</textarea>
            </div>
            <div class="col-span-2">
              <label class="label">作品文件</label>
              <div class="file-upload-zone" data-action="upload-file" data-project-id="${project.id}">
                <i class="fas fa-cloud-upload-alt text-2xl text-blue-400 mb-2"></i>
                <p class="text-sm text-blue-600">点击上传作品文件</p>
                <p class="text-xs text-blue-400 mt-1">支持 PDF 格式，最大10MB</p>
              </div>
              <input type="file" class="hidden file-input" accept=".pdf" data-project-id="${project.id}">
              <div class="files-container mt-3">
                ${(project.files || []).map(file => `
                  <div class="file-item">
                    <div class="flex items-center">
                      <i class="fas fa-file-pdf"></i>
                      <span class="text-sm">${file.name}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <button class="btn-secondary btn-sm" data-action="view-file" data-url="${file.data}">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button class="btn-danger btn-sm" data-action="remove-file" data-project-id="${project.id}" data-file-id="${file.id}">
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    this.bindProjectEvents();
  }

  bindProjectEvents() {
    document.querySelectorAll('[data-action="toggle-project"]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (!e.target.closest('[data-action="remove-project"]')) {
          this.toggleProject(parseInt(el.dataset.id));
        }
      });
    });

    document.querySelectorAll('[data-action="remove-project"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeProject(parseInt(btn.dataset.id));
      });
    });

    document.querySelectorAll('[data-project-id] input, [data-project-id] textarea').forEach(input => {
      input.addEventListener('input', () => {
        this.updateProject(parseInt(input.dataset.projectId), input.dataset.field, input.value);
      });
    });

    document.querySelectorAll('[data-action="upload-file"]').forEach(zone => {
      zone.addEventListener('click', () => {
        const input = zone.nextElementSibling;
        input.click();
      });
    });

    document.querySelectorAll('.file-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.handleProjectFileUpload(parseInt(input.dataset.projectId), file);
        }
      });
    });

    document.querySelectorAll('[data-action="view-file"]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.open(btn.dataset.url, '_blank');
      });
    });

    document.querySelectorAll('[data-action="remove-file"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.removeProjectFile(parseInt(btn.dataset.projectId), parseInt(btn.dataset.fileId));
      });
    });
  }

  addCampus() {
    this.data.campus.unshift({
      id: Date.now(),
      startDate: '',
      endDate: '',
      position: '',
      organization: '',
      content: '',
      achievements: ''
    });
    this.renderCampus();
    this.markUnsaved();
  }

  removeCampus(id) {
    this.data.campus = this.data.campus.filter(c => c.id !== id);
    this.renderCampus();
    this.markUnsaved();
  }

  updateCampus(id, field, value) {
    const item = this.data.campus.find(c => c.id === id);
    if (item) {
      item[field] = value;
      this.markUnsaved();
    }
  }

  renderCampus() {
    const container = document.getElementById('campusList');
    if (!container) return;

    container.innerHTML = this.data.campus.map(item => `
      <div class="card p-5" data-campus-id="${item.id}">
        <div class="flex items-start justify-between mb-4">
          <h3 class="font-semibold text-blue-900">校园经历</h3>
          <button class="btn-danger" data-action="remove-campus" data-id="${item.id}">
            <i class="fas fa-trash-alt"></i> 删除
          </button>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">开始时间</label>
            <input type="month" class="input-field" value="${item.startDate || ''}" data-field="startDate" data-campus-id="${item.id}">
          </div>
          <div>
            <label class="label">结束时间</label>
            <input type="month" class="input-field" value="${item.endDate || ''}" data-field="endDate" data-campus-id="${item.id}">
          </div>
          <div>
            <label class="label">职位</label>
            <input type="text" class="input-field" placeholder="如：学生会主席" value="${item.position || ''}" data-field="position" data-campus-id="${item.id}">
          </div>
          <div>
            <label class="label">组织名称</label>
            <input type="text" class="input-field" placeholder="如：学生会" value="${item.organization || ''}" data-field="organization" data-campus-id="${item.id}">
          </div>
          <div class="col-span-2">
            <label class="label">工作内容</label>
            <textarea class="input-field" rows="3" placeholder="描述工作内容..." data-field="content" data-campus-id="${item.id}">${item.content || ''}</textarea>
          </div>
          <div class="col-span-2">
            <label class="label">成果</label>
            <input type="text" class="input-field" placeholder="描述你的成果" value="${item.achievements || ''}" data-field="achievements" data-campus-id="${item.id}">
          </div>
        </div>
      </div>
    `).join('');

    this.bindCampusEvents();
  }

  bindCampusEvents() {
    document.querySelectorAll('[data-action="remove-campus"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.removeCampus(parseInt(btn.dataset.id));
      });
    });

    document.querySelectorAll('[data-campus-id] input, [data-campus-id] textarea').forEach(input => {
      input.addEventListener('input', () => {
        this.updateCampus(parseInt(input.dataset.campusId), input.dataset.field, input.value);
      });
    });
  }

  addSkillCategory() {
    this.data.skills.push({
      id: Date.now(),
      category: '新分类',
      items: []
    });
    this.renderSkills();
    this.markUnsaved();
  }

  removeSkillCategory(id) {
    this.data.skills = this.data.skills.filter(s => s.id !== id);
    this.renderSkills();
    this.markUnsaved();
  }

  addSkill(categoryId) {
    const category = this.data.skills.find(s => s.id === categoryId);
    if (category) {
      if (!category.items) category.items = [];
      category.items.push({ id: Date.now(), name: '' });
      this.renderSkills();
      this.markUnsaved();
    }
  }

  removeSkill(categoryId, skillId) {
    const category = this.data.skills.find(s => s.id === categoryId);
    if (category && category.items) {
      category.items = category.items.filter(i => i.id !== skillId);
      this.renderSkills();
      this.markUnsaved();
    }
  }

  updateSkillCategory(id, value) {
    const category = this.data.skills.find(s => s.id === id);
    if (category) {
      category.category = value;
      this.markUnsaved();
    }
  }

  updateSkill(categoryId, skillId, value) {
    const category = this.data.skills.find(s => s.id === categoryId);
    if (category && category.items) {
      const skill = category.items.find(i => i.id === skillId);
      if (skill) {
        skill.name = value;
        this.markUnsaved();
      }
    }
  }

  renderSkills() {
    const container = document.getElementById('skillsList');
    if (!container) return;

    container.innerHTML = this.data.skills.map(cat => `
      <div class="card p-5" data-skill-cat-id="${cat.id}">
        <div class="flex items-center justify-between mb-4">
          <input type="text" class="input-field font-semibold text-blue-900 w-32" value="${cat.category || ''}" data-action="update-category" data-cat-id="${cat.id}">
          <div class="flex items-center gap-2">
            <button class="btn-secondary btn-sm" data-action="add-skill" data-cat-id="${cat.id}">
              <i class="fas fa-plus"></i>
            </button>
            <button class="btn-danger btn-sm" data-action="remove-category" data-cat-id="${cat.id}">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
        <div class="space-y-2">
          ${(cat.items || []).map(skill => `
            <div class="flex items-center gap-2">
              <input type="text" class="skill-input" placeholder="技能名称" value="${skill.name || ''}" data-skill-id="${skill.id}" data-cat-id="${cat.id}">
              <button class="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500" data-action="remove-skill" data-cat-id="${cat.id}" data-skill-id="${skill.id}">
                <i class="fas fa-times"></i>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    this.bindSkillEvents();
  }

  bindSkillEvents() {
    document.querySelectorAll('[data-action="remove-category"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.removeSkillCategory(parseInt(btn.dataset.catId));
      });
    });

    document.querySelectorAll('[data-action="add-skill"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.addSkill(parseInt(btn.dataset.catId));
      });
    });

    document.querySelectorAll('[data-action="remove-skill"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.removeSkill(parseInt(btn.dataset.catId), parseInt(btn.dataset.skillId));
      });
    });

    document.querySelectorAll('[data-action="update-category"]').forEach(input => {
      input.addEventListener('input', () => {
        this.updateSkillCategory(parseInt(input.dataset.catId), input.value);
      });
    });

    document.querySelectorAll('.skill-input').forEach(input => {
      input.addEventListener('input', () => {
        this.updateSkill(parseInt(input.dataset.catId), parseInt(input.dataset.skillId), input.value);
      });
    });
  }

  loadData() {
    try {
      const data = localStorage.getItem('resumeData');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  saveData() {
    localStorage.setItem('resumeData', JSON.stringify(this.data));
    this.showToast('保存成功');
  }

  startAutoSave() {
    setInterval(() => {
      localStorage.setItem('resumeData', JSON.stringify(this.data));
    }, 30000);
  }

  markUnsaved() {
    localStorage.setItem('resumeData', JSON.stringify(this.data));
  }

  exportPDF() {
    const element = document.createElement('div');
    element.style.cssText = 'padding: 40px; background: white; font-family: "Noto Sans SC", sans-serif;';
    
    const b = this.data.basic;
    let html = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 28px; font-weight: bold; color: #1e3a8a; margin-bottom: 8px;">${b.name || '姓名'}</h1>
        <p style="color: #64748b; font-size: 16px;">${b.jobTarget || '求职意向'}</p>
        <div style="margin-top: 12px; font-size: 14px; color: #94a3b8;">
          ${b.phone ? `<span style="margin-right: 16px;">📞 ${b.phone}</span>` : ''}
          ${b.email ? `<span>📧 ${b.email}</span>` : ''}
        </div>
      </div>
    `;

    if (this.data.education.length > 0) {
      html += `
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 18px; font-weight: bold; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin-bottom: 16px;">教育经历</h2>
          ${this.data.education.map(edu => `
            <div style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="font-weight: 600; color: #1e40af;">${edu.school || ''} · ${edu.major || ''}</span>
                <span style="font-size: 14px; color: #64748b;">${edu.startDate || ''} ~ ${edu.endDate || ''}</span>
              </div>
              <div style="font-size: 14px; color: #64748b; margin-top: 4px;">${edu.degree || ''}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</div>
              ${(edu.honors || []).length > 0 ? `
                <div style="margin-top: 8px; font-size: 14px; color: #475569;">
                  ${edu.honors.map(h => `🏆 ${h.text || ''}`).join('<br>')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }

    if (this.data.projects.length > 0) {
      html += `
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 18px; font-weight: bold; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin-bottom: 16px;">项目经历</h2>
          ${this.data.projects.map(proj => `
            <div style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="font-weight: 600; color: #1e40af;">${proj.name || ''}</span>
                <span style="font-size: 14px; color: #64748b;">${proj.startDate || ''} ~ ${proj.endDate || ''}</span>
              </div>
              <div style="font-size: 14px; color: #64748b; margin-top: 4px;">${proj.role || ''} | ${proj.techStack || ''}</div>
              ${proj.description ? `<div style="font-size: 14px; color: #475569; margin-top: 8px;">${proj.description}</div>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }

    if (this.data.campus.length > 0) {
      html += `
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 18px; font-weight: bold; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin-bottom: 16px;">校园经历</h2>
          ${this.data.campus.map(c => `
            <div style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="font-weight: 600; color: #1e40af;">${c.organization || ''} · ${c.position || ''}</span>
                <span style="font-size: 14px; color: #64748b;">${c.startDate || ''} ~ ${c.endDate || ''}</span>
              </div>
              ${c.content ? `<div style="font-size: 14px; color: #475569; margin-top: 8px;">${c.content}</div>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }

    if (this.data.skills.length > 0) {
      html += `
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 18px; font-weight: bold; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin-bottom: 16px;">个人技能</h2>
          ${this.data.skills.map(cat => `
            <div style="margin-bottom: 12px;">
              <div style="font-weight: 600; color: #1e40af; margin-bottom: 8px;">${cat.category || ''}</div>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${(cat.items || []).map(skill => `
                  <span style="padding: 4px 12px; background: #eff6ff; border-radius: 20px; font-size: 14px; color: #1e40af;">${skill.name || ''}</span>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    element.innerHTML = html;

    html2pdf().set({
      margin: 15,
      filename: `简历_${b.name || '未命名'}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(element).save();
    
    this.showToast('PDF导出成功');
  }

  renderAll() {
    Object.keys(this.data.basic).forEach(key => {
      const input = document.querySelector(`[data-field="${key}"]`);
      if (input && key !== 'avatar') {
        input.value = this.data.basic[key] || '';
      }
    });
    this.renderAvatar();
    this.updateNavInfo();
    this.renderEducation();
    this.renderProjects();
    this.renderCampus();
    this.renderSkills();
  }

  showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show' + (type === 'error' ? ' error' : '');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new ResumeApp();
});
