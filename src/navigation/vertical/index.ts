export default [
  {
    title: 'dashboard.title',
    to: { name: 'root' },
    icon: { icon: 'tabler-dashboard' },


    action: 'read',
    subject: 'Dashboard'


  },
  {
    title: 'products.title',
    to: { name: 'products' },
    icon: { icon: 'tabler-package' },
    action: 'read',
    subject: 'Dashboard'
  },

  {
    title: 'unit.title',
    to: { name: 'units' },
    icon: { icon: 'tabler-package' },
    action: 'read',
    subject: 'Dashboard'
  },
  // {
  //   title: 'categorys.title',
  //   to: { name: 'categories' },
  //   icon: { icon: 'tabler-package' },
  //   action: 'read',
  //   subject: 'Dashboard'
  // },
  {
    title: 'users.title',
    to: { name: 'users' },
    icon: { icon: 'tabler-users' },
    action: 'read',
    subject: 'Dashboard'
  },
  {
    title: 'sales',
    to: { name: 'sales' },
    icon: { icon: 'tabler-cash-register' },
    action: 'read',
    subject: 'Dashboard'
  },
  {
    title: 'Mijozlar',
    to: { name: 'customers' },
    icon: { icon: 'tabler-users-group' },
    action: 'read',
    subject: 'Dashboard'
  },
  {
    title: 'Qarzdorlar',
    to: { name: 'debts' },
    icon: { icon: 'tabler-report-money' },
    action: 'read',
    subject: 'Dashboard'
  },
]
