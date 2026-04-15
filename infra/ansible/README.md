# NeptuneFriend — Ansible Configuration Management

## Directory structure

```
infra/ansible/
├── ansible.cfg                    # Ansible configuration
├── inventory.ini                  # Host inventory (update IPs after terraform apply)
├── group_vars/
│   ├── all.yml                    # Variables for all hosts
│   └── staging.yml                # Staging specific variables
├── host_vars/                     # Per-host variables (if needed)
├── playbooks/
│   ├── site.yml                   # Main playbook — runs all roles
│   └── staging.yml                # Staging environment playbook
└── roles/
    ├── common/                    # OS hardening, SSH, firewall, kernel params
    ├── docker/                    # Docker CE installation and configuration
    ├── kubernetes/                # kubectl, helm, AWS CLI installation
    └── nodejs/                    # Node.js 20 via nvm
```

## Prerequisites

```bash
# Install Ansible
sudo apt update && sudo apt install ansible -y
ansible --version

# Install required collections
ansible-galaxy collection install community.general
ansible-galaxy collection install ansible.posix
```

## Usage

### Run full hardening on all nodes
```bash
cd infra/ansible
ansible-playbook playbooks/site.yml -i inventory.ini
```

### Run only on staging
```bash
ansible-playbook playbooks/staging.yml -i inventory.ini
```

### Run specific tags only
```bash
# Only run hardening tasks
ansible-playbook playbooks/site.yml -i inventory.ini --tags hardening

# Only install Docker
ansible-playbook playbooks/site.yml -i inventory.ini --tags docker

# Only install Kubernetes tools
ansible-playbook playbooks/site.yml -i inventory.ini --tags kubernetes
```

### Dry run (check mode)
```bash
ansible-playbook playbooks/site.yml -i inventory.ini --check
```

### Test connectivity
```bash
ansible all -i inventory.ini -m ping
```

## After terraform apply

1. Get node IPs from AWS console or:
```bash
aws ec2 describe-instances \
  --filters "Name=tag:Project,Values=neptunefriend" \
  --query "Reservations[*].Instances[*].PublicIpAddress" \
  --output text
```

2. Update `inventory.ini` with the real IPs

3. Run the playbook:
```bash
ansible-playbook playbooks/site.yml -i inventory.ini
```

## Idempotency

All playbooks are idempotent — safe to run multiple times. Running the same playbook twice will not change anything if the system is already in the desired state.
