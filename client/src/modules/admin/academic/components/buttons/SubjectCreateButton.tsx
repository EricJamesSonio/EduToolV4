import Button from '@/components/Button/Button';

interface SubjectCreateButtonProps {
  onClick: () => void;
  loading?: boolean;
}

const SubjectCreateButton: React.FC<SubjectCreateButtonProps> = ({
  onClick,
  loading = false,
}) => {
  return (
    <Button
      variant="primary"
      size="sm"
      onClick={onClick}
      disabled={loading}
    >
      + Create Subject
    </Button>
  );
};

export default SubjectCreateButton;